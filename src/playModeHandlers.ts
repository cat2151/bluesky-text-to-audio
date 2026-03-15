import { parse as mml2abcParse } from './mml2abc.mjs';
import type { SequencerNodes } from './types';
import { loadTone } from './loaders/tone';
import { loadSequencer } from './loaders/sequencer';
import { parseMmlViaLibrary } from './loaders/mmlToJson';
import { playWithYm2151, renderYm2151AudioBuffer } from './loaders/ym2151';
import { playWithVoicevox, renderVoicevoxAudioBuffer } from './loaders/voicevox';
import { playWithSurgeXt, renderSurgeXtAudioBuffer } from './loaders/surgext';
import { playMixMode as playMixModeImpl } from './loaders/mix';
import type { AbcjsPlayer } from './loaders/abcjsPlayer';
import { chordToMml, chordPreprocessMixText } from './chordToMml';
import { audioBufferToWavBlob } from './wavEncoder';
import { applyRandomToneToMmlIfNeeded } from './tonejsRandomTone';

const LOG_PREFIX = '[BTA:playButton]';

type ErrorHandler = (logLabel: string, message: string, error: unknown) => void;

/** Tone.jsシーケンサーノードへの参照（投稿ごとに保持） */
export interface TonejsRef {
  nodes: SequencerNodes | null;
}

export async function playMmlabcMode(
  mml: string,
  abcjsPlayer: AbcjsPlayer,
  scoreDiv: HTMLElement,
  handleError: ErrorHandler
): Promise<void> {
  let abcText = '';
  try {
    abcText = mml2abcParse(mml);
  } catch (error) {
    handleError('MML parse error:', 'MML parse error', error);
    return;
  }
  abcjsPlayer.renderAndPlay(scoreDiv, abcText);
}

export async function playChord2mmlMode(
  chord: string,
  abcjsPlayer: AbcjsPlayer,
  scoreDiv: HTMLElement,
  handleError: ErrorHandler
): Promise<void> {
  let abcText = '';
  try {
    const mml = await chordToMml(chord);
    abcText = mml2abcParse(mml);
  } catch (error) {
    handleError('chord2mml error (load or parse):', 'chord2mml error', error);
    return;
  }
  abcjsPlayer.renderAndPlay(scoreDiv, abcText);
}

export async function playToneJsMode(
  mml: string,
  tonejsRef: TonejsRef,
  handleError: ErrorHandler
): Promise<void> {
  let Tone;
  let sequencer;
  try {
    [Tone, sequencer] = await Promise.all([loadTone(), loadSequencer()]);
  } catch (e2: unknown) {
    handleError('Tone.js または tonejs-json-sequencer の読み込みに失敗しました:', 'ライブラリ読み込みエラー', e2);
    return;
  }
  // @～によるinstrument/effect指定がない場合はランダム音色を適用する（仮実装: issue #165）
  const mmlWithTone = applyRandomToneToMmlIfNeeded(mml);
  let sequence;
  try {
    sequence = await parseMmlViaLibrary(mmlWithTone);
  } catch (e2: unknown) {
    handleError('MML parse error:', 'MML parse error', e2);
    return;
  }
  try {
    await Tone.start();
    if (!tonejsRef.nodes) {
      tonejsRef.nodes = new sequencer.SequencerNodes();
    }
    await sequencer.playSequence(Tone, tonejsRef.nodes, sequence);
    Tone.Transport.start();
  } catch (e2: unknown) {
    handleError('Tone.js play error:', 'Tone.js play error', e2);
  }
}

export async function playYm2151Mode(
  mml: string,
  handleError: ErrorHandler,
  onPlayStart?: () => void
): Promise<void> {
  try {
    await playWithYm2151(mml, onPlayStart);
  } catch (e2: unknown) {
    handleError('YM2151 play error:', 'YM2151 play error', e2);
  }
}

export async function playMixMode(
  text: string,
  handleError: ErrorHandler,
  onPlayStart?: () => void
): Promise<void> {
  try {
    await playMixModeImpl(text, {
      onPlayStart,
      renderers: {
        voicevox: renderVoicevoxAudioBuffer,
        surgext: renderSurgeXtAudioBuffer,
      },
    });
  } catch (e2: unknown) {
    handleError('Mix play error:', 'Mix play error', e2);
  }
}

export { chordPreprocessMixText };

export async function playVoicevoxMode(
  text: string,
  handleError: ErrorHandler,
  onPlayStart?: () => void
): Promise<void> {
  try {
    await playWithVoicevox(text, onPlayStart);
  } catch (err: unknown) {
    handleError('VOICEVOX error:', 'VOICEVOX error', err);
  }
}

export async function playSurgeXtMode(
  text: string,
  handleError: ErrorHandler,
  onPlayStart?: () => void
): Promise<void> {
  try {
    await playWithSurgeXt(text, onPlayStart);
  } catch (err: unknown) {
    handleError('Surge XT error:', 'Surge XT error', err);
  }
}

export async function exportWavHandler(
  mml: string,
  showErrorToast: (message: string) => void
): Promise<void> {
  let audioBuffer: AudioBuffer;
  try {
    audioBuffer = await renderYm2151AudioBuffer(mml);
  } catch (err: unknown) {
    console.error(LOG_PREFIX, 'WAV export error:', err);
    showErrorToast('WAV export error');
    return;
  }
  const blob = audioBufferToWavBlob(audioBuffer);
  const arrayBuf = await blob.arrayBuffer();
  const uint8 = new Uint8Array(arrayBuf);
  const chunkSize = 0x8000;
  const chunks: string[] = [];
  for (let i = 0; i < uint8.length; i += chunkSize) {
    chunks.push(String.fromCharCode(...uint8.subarray(i, i + chunkSize)));
  }
  const base64 = btoa(chunks.join(''));
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `ym2151_${timestamp}.wav`;
  chrome.runtime.sendMessage({ type: 'downloadWav', base64, filename }, res => {
    const result = res as { success: boolean; error?: string } | undefined;
    if (!result?.success) {
      console.error(LOG_PREFIX, 'WAV download error:', result?.error);
      showErrorToast('WAV download error');
    }
  });
}
