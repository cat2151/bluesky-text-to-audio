// Mix mode: Tone.js + YM2151 + VOICEVOX を1つのwavデータにmixして演奏する (検証用)
//
// 各処理フェーズにconsole.logしており、動作確認しやすくしている。
//
// Pipeline:
//   テキスト → parseTracks() → tracks[]
//   → 各trackを並列にオフラインレンダリング (VOICEVOX/YM2151/Tone.js)
//   → AudioBuffer[]を共通サンプルレートにリサンプリング
//   → 全AudioBufferをmix (1/N ゲイン加算でクリップ防止)
//   → Web Audio API で再生

import * as ToneModule from 'tone';
import type { ToneLib } from '../types';
import { renderYm2151AudioBuffer } from './ym2151';
import { renderVoicevoxAudioBuffer } from './voicevox';
import { renderSurgeXTAudioBuffer } from './surgeXT';
import { loadSequencer } from './sequencer';
import { parseMmlViaLibrary } from './mmlToJson';
import { getAudioContext } from '../audioContext';
import { parseTracks } from '../mixParser';

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
  console.log(
    LOG_PREFIX,
    'Parsed tracks:',
    tracks.map(t => ({ type: t.type, text: t.text.substring(0, 30) })),
  );

  console.log(LOG_PREFIX, 'Rendering tracks in parallel...');
  const rawBuffers = await Promise.all(
    tracks.map(async (track, i) => {
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
        const buf = await renderSurgeXTAudioBuffer(track.text);
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
