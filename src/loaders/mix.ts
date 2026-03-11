// Mix mode: Tone.js + YM2151 + VOICEVOX を1つのwavデータにmixして演奏する (検証用)
//
// 各処理フェーズにconsole.logしており、動作確認しやすくしている。
//
// Pipeline:
//   テキスト → parseTracks() → tracks[]
//   → 各trackを並列にオフラインレンダリング (VOICEVOX/YM2151/Tone.js)
//   → AudioBuffer[]を共通サンプルレートにリサンプリング
//   → 全AudioBufferをmix (加算)
//   → Web Audio API で再生

import * as ToneModule from 'tone';
import type { ToneLib } from '../types';
import { renderYm2151AudioBuffer } from './ym2151';
import { loadSequencer } from './sequencer';
import { parseMmlViaLibrary } from './mmlToJson';
import { getAudioContext } from '../audioContext';
import { parseTracks } from '../mixParser';

export { parseTracks };

const LOG_PREFIX = '[BTA:loaders/mix]';

// Tone.jsオフラインレンダリングの上限秒数 (検証用のため固定値)
const TONEJS_OFFLINE_DURATION = 30;

// ---- VOICEVOX: テキスト → AudioBuffer ----
async function renderVoicevoxAudioBuffer(text: string): Promise<AudioBuffer> {
  console.log(LOG_PREFIX, '[VOICEVOX] rendering:', text.substring(0, 50));
  const response = await new Promise<{ success: boolean; audio?: string; error?: string }>(
    (resolve, reject) => {
      chrome.runtime.sendMessage({ type: 'speak', text }, res => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else if (!res) {
          reject(new Error('VOICEVOX: no response from background script'));
        } else {
          resolve(res as { success: boolean; audio?: string; error?: string });
        }
      });
    },
  );

  if (!response.success || !response.audio) {
    throw new Error(response.error ?? 'VOICEVOX error');
  }

  const binaryString = atob(response.audio);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const audioCtx = getAudioContext();
  const buf = await audioCtx.decodeAudioData(bytes.buffer);
  console.log(LOG_PREFIX, `[VOICEVOX] rendered: ${buf.duration.toFixed(2)}s`);
  return buf;
}

// ---- Tone.js: MML → AudioBuffer (オフラインレンダリング) ----
async function renderToneJsAudioBuffer(mml: string): Promise<AudioBuffer> {
  console.log(LOG_PREFIX, '[Tone.js] offline rendering:', mml.substring(0, 50));
  const sequencer = await loadSequencer();
  const sequence = await parseMmlViaLibrary(mml);
  console.log(LOG_PREFIX, '[Tone.js] sequence parsed, events:', sequence.length);

  console.log(LOG_PREFIX, `[Tone.js] starting offline render (${TONEJS_OFFLINE_DURATION}s)`);
  const toneAudio = await ToneModule.Offline(async () => {
    const nodes = new sequencer.SequencerNodes();
    await sequencer.playSequence(ToneModule as unknown as ToneLib, nodes, sequence);
    ToneModule.Transport.start();
  }, TONEJS_OFFLINE_DURATION);

  const buf = toneAudio.get();
  if (!buf) throw new Error('Tone.js offline rendering returned null buffer');
  console.log(LOG_PREFIX, `[Tone.js] offline rendered: ${buf.duration.toFixed(2)}s`);
  return buf;
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
function mixAudioBuffers(buffers: AudioBuffer[]): AudioBuffer {
  if (buffers.length === 0) throw new Error('No buffers to mix');
  const sampleRate = buffers[0].sampleRate;
  const numChannels = 2;
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
        dstCh[i] += srcCh[i];
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
        return renderVoicevoxAudioBuffer(track.text);
      } else if (track.type === 'YM2151') {
        const buf = await renderYm2151AudioBuffer(track.text);
        console.log(LOG_PREFIX, `[track ${i}] YM2151 rendered: ${buf.duration.toFixed(2)}s`);
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

  console.log(LOG_PREFIX, 'Mixing...');
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
