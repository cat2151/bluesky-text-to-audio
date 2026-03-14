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
import type { ToneLib } from '../types';
import { renderYm2151AudioBuffer } from './ym2151';
import { renderVoicevoxAudioBuffer } from './voicevox';
import { renderSurgeXtAudioBuffer } from './surgext';
import { loadSequencer } from './sequencer';
import { parseMmlViaLibrary } from './mmlToJson';
import { getAudioContext } from '../audioContext';
import { parseTracks } from '../mixParser';
import { audioBufferToWavBlob } from '../wavEncoder';

export { parseTracks };

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

// ---- Tone.js: MML → AudioBuffer (オフラインレンダリング + 末尾無音トリム) ----
async function renderToneJsAudioBuffer(mml: string): Promise<AudioBuffer> {
  console.log(LOG_PREFIX, '[Tone.js] offline rendering:', mml.substring(0, 50));
  const sequencer = await loadSequencer();
  const sequence = await parseMmlViaLibrary(mml);
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

async function applyEffectAndPlay(mixedBuffer: AudioBuffer, effectText: string): Promise<void> {
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
export async function playMixMode(text: string): Promise<void> {
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
        const buf = await renderVoicevoxAudioBuffer(track.text);
        console.log(LOG_PREFIX, `[track ${i}] VOICEVOX rendered: ${buf.duration.toFixed(2)}s`);
        return buf;
      } else if (track.type === 'YM2151') {
        const buf = await renderYm2151AudioBuffer(track.text);
        console.log(LOG_PREFIX, `[track ${i}] YM2151 rendered: ${buf.duration.toFixed(2)}s`);
        return buf;
      } else if (track.type === 'SURGE_XT') {
        const buf = await renderSurgeXtAudioBuffer(track.text);
        console.log(LOG_PREFIX, `[track ${i}] Surge XT rendered: ${buf.duration.toFixed(2)}s`);
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
    await applyEffectAndPlay(mixedBuffer, effectTracks[0].text);
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
  });

  console.log(LOG_PREFIX, 'Playback finished.');
}
