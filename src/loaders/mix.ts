// Mix mode: Tone.js + YM2151 + VOICEVOX + Surge XT を1つのwavデータにmixして演奏する (検証用)
//
// 各処理フェーズにconsole.logしており、動作確認しやすくしている。
//
// Pipeline:
//   テキスト → parseTracks() → tracks[]
//   → 各trackを並列にオフラインレンダリング (VOICEVOX/YM2151/Tone.js/Surge XT)
//   → AudioBuffer[]を共通サンプルレートにリサンプリング
//   → 全AudioBufferをmix (1/N ゲイン加算でクリップ防止)
//   → Web Audio API で再生

import * as ToneModule from 'tone';
import * as ABCJS from 'abcjs';
import { parse as mml2abcParse } from '../mml2abc.mjs';
import type { ToneLib } from '../types';
import { renderYm2151AudioBuffer } from './ym2151';
import { loadSequencer } from './sequencer';
import { parseMmlViaLibrary } from './mmlToJson';
import { getAudioContext } from '../audioContext';
import { parseTracks } from '../mixParser';
import { audioBufferToWavBlob } from '../wavEncoder';
import { chordToMml } from '../chordToMml';
import { applyRandomToneToMmlIfNeeded } from '../tonejsRandomTone';

export { parseTracks };

// ---- 環境依存レンダラーの依存性注入インターフェース ----
// Chrome拡張コンテキストでのみ動作するレンダラーを外部から注入することで、
// Obsidian / Quartz 4 など Chrome拡張外の環境でも chrome 依存なしに利用できる。
//
// Chrome拡張から使う場合:
//   import { renderVoicevoxAudioBuffer } from './loaders/voicevox';
//   import { renderSurgeXtAudioBuffer } from './loaders/surgext';
//   playMixMode(text, { renderers: { voicevox: renderVoicevoxAudioBuffer, surgext: renderSurgeXtAudioBuffer } });
//
// Obsidian / Quartz 4 から使う場合 (VOICEVOX/Surge XT トラックは含めないこと):
//   playMixMode(text);
export interface TrackRenderers {
  /** VOICEVOX テキスト音声合成レンダラー (Chrome拡張専用) */
  voicevox?: (text: string) => Promise<AudioBuffer>;
  /** Surge XT MML音源レンダラー (Chrome拡張専用) */
  surgext?: (text: string) => Promise<AudioBuffer>;
}

export interface PlayMixModeOptions {
  onPlayStart?: () => void;
  /** 環境依存レンダラー。省略時は VOICEVOX/Surge XT トラックが含まれるとエラーになります。 */
  renderers?: TrackRenderers;
}

const LOG_PREFIX = '[BTA:loaders/mix]';

// Tone.jsオフラインレンダリングの上限秒数
const TONEJS_OFFLINE_MAX_DURATION = 30;

// ---- Tone.js オフラインバッファの末尾無音をトリムする ----
// 末尾に無音区間があると mix 結果が不必要に長くなるため除去する。
function trimTrailingSilence(buffer: AudioBuffer, threshold = 0.0001): AudioBuffer {
  const ch0 = buffer.getChannelData(0);
  let lastNonSilent = 0;
  for (let i = ch0.length - 1; i >= 0; i--) {
    if (Math.abs(ch0[i]) > threshold) {
      lastNonSilent = i;
      break;
    }
  }
  // 末尾に 0.1s 分のテールを残す
  const tail = Math.ceil(buffer.sampleRate * 0.1);
  const newLength = Math.min(lastNonSilent + tail + 1, buffer.length);
  if (newLength === buffer.length) return buffer;
  const audioCtx = getAudioContext();
  const trimmed = audioCtx.createBuffer(buffer.numberOfChannels, newLength, buffer.sampleRate);
  for (let c = 0; c < buffer.numberOfChannels; c++) {
    trimmed.getChannelData(c).set(buffer.getChannelData(c).subarray(0, newLength));
  }
  console.log(
    LOG_PREFIX,
    `[Tone.js] trimmed silence: ${buffer.duration.toFixed(2)}s → ${trimmed.duration.toFixed(2)}s`,
  );
  return trimmed;
}

// ---- abcjs: ABC text → AudioBuffer (オフラインレンダリング) ----
async function renderAbcAudioBuffer(abcText: string): Promise<AudioBuffer> {
  console.log(LOG_PREFIX, '[abcjs] offline rendering ABC text...');
  const dummyDiv = document.createElement('div');
  const tuneObjects = ABCJS.renderAbc(dummyDiv, abcText);
  const visualObj = tuneObjects[0];
  if (!visualObj) throw new Error('abcjs could not parse ABC text');
  const synth = new ABCJS.synth.CreateSynth();
  await synth.init({ visualObj, options: {} });
  await synth.prime();
  const buffer = synth.getAudioBuffer();
  if (!buffer) throw new Error('abcjs getAudioBuffer returned null');
  console.log(LOG_PREFIX, `[abcjs] offline rendered: ${buffer.duration.toFixed(2)}s`);
  return buffer;
}

// ---- mmlabc: MML → ABC → AudioBuffer ----
async function renderMmlabcAudioBuffer(mml: string): Promise<AudioBuffer> {
  console.log(LOG_PREFIX, '[mmlabc] offline rendering:', mml.substring(0, 50));
  const abcText = mml2abcParse(mml);
  return renderAbcAudioBuffer(abcText);
}

// ---- chord: コード進行 → MML → (ターゲットエンジン) → AudioBuffer ----
async function renderChordAudioBuffer(chord: string, targetEngine?: import('../mixParser').ChordTargetEngine, renderers?: TrackRenderers): Promise<AudioBuffer> {
  console.log(LOG_PREFIX, '[chord] offline rendering:', chord.substring(0, 50), targetEngine ? `→ ${targetEngine}` : '→ MMLABC');
  const mml = await chordToMml(chord);
  if (targetEngine === 'YM2151') {
    return renderYm2151AudioBuffer(mml);
  } else if (targetEngine === 'TONE_JS') {
    return renderToneJsAudioBuffer(mml);
  } else if (targetEngine === 'SURGE_XT') {
    if (!renderers?.surgext) {
      throw new Error('Surge XT renderer is not available in this context. Provide a surgext renderer via PlayMixModeOptions.renderers.');
    }
    return renderers.surgext(mml);
  } else {
    // MMLABC (default, targetEngine未指定またはMMLABC)
    const abcText = mml2abcParse(mml);
    return renderAbcAudioBuffer(abcText);
  }
}

// ---- Tone.js: MML → AudioBuffer (オフラインレンダリング + 末尾無音トリム) ----
async function renderToneJsAudioBuffer(mml: string): Promise<AudioBuffer> {
  // @～によるinstrument/effect指定がない場合はランダム音色を適用する（仮実装: issue #165）
  const mmlWithTone = applyRandomToneToMmlIfNeeded(mml);
  console.log(LOG_PREFIX, '[Tone.js] offline rendering:', mmlWithTone.substring(0, 50));
  const sequencer = await loadSequencer();
  const sequence = await parseMmlViaLibrary(mmlWithTone);
  if (!Array.isArray(sequence) || sequence.length === 0) {
    throw new Error('Tone.js MML produced no playable events');
  }
  console.log(LOG_PREFIX, '[Tone.js] sequence parsed, events:', sequence.length);

  console.log(LOG_PREFIX, `[Tone.js] starting offline render (max ${TONEJS_OFFLINE_MAX_DURATION}s)`);
  const toneAudio = await ToneModule.Offline(async () => {
    const nodes = new sequencer.SequencerNodes();
    await sequencer.playSequence(ToneModule as unknown as ToneLib, nodes, sequence);
    ToneModule.Transport.start();
  }, TONEJS_OFFLINE_MAX_DURATION);

  const rawBuf = toneAudio.get();
  if (!rawBuf) throw new Error('Tone.js offline rendering returned null buffer');
  console.log(LOG_PREFIX, `[Tone.js] offline rendered: ${rawBuf.duration.toFixed(2)}s`);
  return trimTrailingSilence(rawBuf);
}

// ---- AudioBuffer を targetSampleRate にリサンプリング ----
async function resampleAudioBuffer(buffer: AudioBuffer, targetSampleRate: number): Promise<AudioBuffer> {
  if (Math.abs(buffer.sampleRate - targetSampleRate) < 1) return buffer;
  console.log(LOG_PREFIX, `resampling ${buffer.sampleRate}Hz → ${targetSampleRate}Hz`);
  const numChannels = buffer.numberOfChannels;
  const targetLength = Math.ceil(buffer.duration * targetSampleRate);
  const offlineCtx = new OfflineAudioContext(numChannels, targetLength, targetSampleRate);
  const source = offlineCtx.createBufferSource();
  source.buffer = buffer;
  source.connect(offlineCtx.destination);
  source.start(0);
  return offlineCtx.startRendering();
}

// ---- 複数のAudioBuffer を加算mixする (全て同じsampleRateである前提) ----
// クリップを防ぐため 1/N のゲインをかけて加算する。
function mixAudioBuffers(buffers: AudioBuffer[]): AudioBuffer {
  if (buffers.length === 0) throw new Error('No buffers to mix');
  const sampleRate = buffers[0].sampleRate;
  const numChannels = 2;
  const gain = 1 / buffers.length;
  let maxLength = 0;
  for (const buf of buffers) {
    if (buf.length > maxLength) maxLength = buf.length;
  }

  const audioCtx = getAudioContext();
  const mixed = audioCtx.createBuffer(numChannels, maxLength, sampleRate);

  for (const buf of buffers) {
    for (let c = 0; c < numChannels; c++) {
      const srcCh = c < buf.numberOfChannels ? buf.getChannelData(c) : buf.getChannelData(0);
      const dstCh = mixed.getChannelData(c);
      for (let i = 0; i < buf.length; i++) {
        dstCh[i] += srcCh[i] * gain;
      }
    }
  }

  return mixed;
}

// ---- 現在再生中のソースノード（多重再生防止） ----
let currentSource: AudioBufferSourceNode | null = null;

// ---- effect トラック: mixedBuffer に Tone.js エフェクトをかけて再生 ----
// mixedBuffer を WAV blob → blob URL → @Sampler MML → Tone.js で再生する (検証用仮実装)
// ノート長はサンプル長をカバーできるようにテンポを動的計算する。
// エフェクトのテール含め (mixedBuffer.duration + EFFECT_TAIL_SECONDS) 秒待ってから停止する。
const EFFECT_TAIL_SECONDS = 4;

async function applyEffectAndPlay(mixedBuffer: AudioBuffer, effectText: string, onPlayStart?: () => void): Promise<void> {
  // effectText は '@EffectName' 形式（英数字・アンダースコアのみ）であることを確認する (検証用)
  if (!/^@[A-Za-z0-9_]+$/.test(effectText)) {
    throw new Error(`Invalid effect format: "${effectText}". Expected "@EffectName" (e.g. "@PingPongDelay")`);
  }
  const blob = audioBufferToWavBlob(mixedBuffer);
  const blobUrl = URL.createObjectURL(blob);
  console.log(LOG_PREFIX, `[Effect] Created blob URL for ${mixedBuffer.duration.toFixed(2)}s buffer`);
  // SequencerNodes はノード再利用・disposeAllによる掃除のために関数スコープで管理する
  let nodes: InstanceType<Awaited<ReturnType<typeof loadSequencer>>['SequencerNodes']> | null = null;
  try {
    // l1（全音符）が mixedBuffer.duration + テールをカバーするようにテンポを動的計算する。
    // 全音符 = 240/T 秒、T = floor(240 / totalDuration)、最小1
    const totalDuration = mixedBuffer.duration + EFFECT_TAIL_SECONDS;
    const tempo = Math.max(1, Math.floor(240 / totalDuration));
    const mml = `@Sampler{ "urls": { "C4": "${blobUrl}" } } ${effectText} t${tempo} l1 c`;
    console.log(LOG_PREFIX, '[Effect] MML:', mml.substring(0, 100));
    const sequencer = await loadSequencer();
    const sequence = await parseMmlViaLibrary(mml);
    await ToneModule.start();
    nodes = new sequencer.SequencerNodes();
    await sequencer.playSequence(ToneModule as unknown as ToneLib, nodes, sequence);
    ToneModule.Transport.start();
    try { onPlayStart?.(); } catch { /* UI callback failure must not affect audio playback */ }
    // エフェクトのテール含め (mixedBuffer.duration + EFFECT_TAIL_SECONDS) 秒待つ (検証用)
    const waitMs = totalDuration * 1000;
    await new Promise<void>(resolve => {
      setTimeout(() => {
        ToneModule.Transport.stop();
        resolve();
      }, waitMs);
    });
  } finally {
    ToneModule.Transport.cancel();
    if (nodes) {
      nodes.disposeAll();
    }
    URL.revokeObjectURL(blobUrl);
    console.log(LOG_PREFIX, '[Effect] Revoked blob URL and disposed nodes');
  }
}

// ---- メイン: 全trackをレンダリング → mix → 再生 ----
export async function playMixMode(text: string, options?: PlayMixModeOptions): Promise<void> {
  const { onPlayStart, renderers } = options ?? {};
  const audioCtx = getAudioContext();
  if (audioCtx.state === 'suspended') {
    // resume() はユーザージェスチャーがない場合は失敗することがある。
    // start() 呼び出し時に自動的に再開されるため、エラーは無視してよい。
    audioCtx.resume().catch(() => {});
  }

  console.log(LOG_PREFIX, 'Parsing tracks...');
  const tracks = parseTracks(text);
  if (tracks.length === 0) throw new Error('No tracks found in mix mode text');

  const effectTracks = tracks.filter(t => t.type === 'EFFECT');
  const audioTracks = tracks.filter(t => t.type !== 'EFFECT');
  if (audioTracks.length === 0) throw new Error('No audio tracks found in mix mode text');

  console.log(
    LOG_PREFIX,
    'Parsed tracks:',
    tracks.map(t => ({ type: t.type, text: t.text.substring(0, 30) })),
  );

  console.log(LOG_PREFIX, 'Rendering tracks in parallel...');
  const rawBuffers = await Promise.all(
    audioTracks.map(async (track, i) => {
      console.log(LOG_PREFIX, `[track ${i}] rendering ${track.type}: ${track.text.substring(0, 30)}`);
      if (track.type === 'VOICEVOX') {
        if (!renderers?.voicevox) {
          throw new Error('VOICEVOX renderer is not available in this context. Provide a voicevox renderer via PlayMixModeOptions.renderers.');
        }
        const buf = await renderers.voicevox(track.text);
        console.log(LOG_PREFIX, `[track ${i}] VOICEVOX rendered: ${buf.duration.toFixed(2)}s`);
        return buf;
      } else if (track.type === 'YM2151') {
        const buf = await renderYm2151AudioBuffer(track.text);
        console.log(LOG_PREFIX, `[track ${i}] YM2151 rendered: ${buf.duration.toFixed(2)}s`);
        return buf;
      } else if (track.type === 'SURGE_XT') {
        if (!renderers?.surgext) {
          throw new Error('Surge XT renderer is not available in this context. Provide a surgext renderer via PlayMixModeOptions.renderers.');
        }
        const buf = await renderers.surgext(track.text);
        console.log(LOG_PREFIX, `[track ${i}] Surge XT rendered: ${buf.duration.toFixed(2)}s`);
        return buf;
      } else if (track.type === 'MMLABC') {
        const buf = await renderMmlabcAudioBuffer(track.text);
        console.log(LOG_PREFIX, `[track ${i}] mmlabc rendered: ${buf.duration.toFixed(2)}s`);
        return buf;
      } else if (track.type === 'CHORD') {
        const buf = await renderChordAudioBuffer(track.text, track.targetEngine, renderers);
        console.log(LOG_PREFIX, `[track ${i}] chord rendered: ${buf.duration.toFixed(2)}s`);
        return buf;
      } else {
        return renderToneJsAudioBuffer(track.text);
      }
    }),
  );

  console.log(LOG_PREFIX, 'All tracks rendered. Resampling to', audioCtx.sampleRate, 'Hz...');
  const resampled = await Promise.all(
    rawBuffers.map(buf => resampleAudioBuffer(buf, audioCtx.sampleRate)),
  );

  console.log(LOG_PREFIX, `Mixing ${resampled.length} tracks (gain=1/${resampled.length})...`);
  const mixedBuffer = mixAudioBuffers(resampled);
  console.log(
    LOG_PREFIX,
    `Mixed buffer: ${mixedBuffer.duration.toFixed(2)}s at ${mixedBuffer.sampleRate}Hz`,
  );

  if (currentSource) {
    // stop() は既に停止済みの場合 InvalidStateError を投げるため無視する
    try { currentSource.stop(); } catch { /* already stopped */ }
  }

  // effect トラックがある場合は Tone.js を使ってエフェクトをかけて再生する
  // 複数の effect トラックがある場合は最初の1つのみ適用する (検証用仮実装の制約)
  if (effectTracks.length > 0) {
    if (effectTracks.length > 1) {
      console.warn(LOG_PREFIX, `Multiple effect tracks found (${effectTracks.length}). Only the first one will be applied.`);
    }
    console.log(LOG_PREFIX, `Applying effect: ${effectTracks[0].text}`);
    await applyEffectAndPlay(mixedBuffer, effectTracks[0].text, onPlayStart);
    console.log(LOG_PREFIX, 'Effect playback finished.');
    return;
  }

  const source = audioCtx.createBufferSource();
  source.buffer = mixedBuffer;
  source.connect(audioCtx.destination);
  currentSource = source;

  await new Promise<void>(resolve => {
    source.onended = () => {
      source.disconnect();
      if (currentSource === source) currentSource = null;
      resolve();
    };
    source.start();
    try { onPlayStart?.(); } catch { /* UI callback failure must not affect audio playback */ }
  });

  console.log(LOG_PREFIX, 'Playback finished.');
}
