// ---- bluesky-text-to-audio core library entry point ----
//
// このファイルは ObsidianやQuartz 4の拡張からcoreを利用するためのライブラリエントリポイントです。
//
// 使用例 (Obsidian plugin / Quartz 4 transformer) — chrome依存なし:
//   import { playMixMode, detectModeFromText, parseTracks } from 'bluesky-text-to-audio/src/core';
//
//   // playMixMode のシグネチャ:
//   //   (text: string, options?: PlayMixModeOptions) => Promise<void>
//   // mmlmix コードブロックにplayボタンを追加し、クリックで playMixMode(source) を呼ぶ。
//   // VOICEVOX / Surge XT トラックを含まない場合、chrome依存は不要。
//   btn.addEventListener('click', () => playMixMode(source));
//
// 使用例 (Chrome拡張) — VOICEVOX / Surge XT を使いたい場合:
//   import { playMixMode } from 'bluesky-text-to-audio/src/core';
//   import { renderVoicevoxAudioBuffer } from 'bluesky-text-to-audio/src/loaders/voicevox';
//   import { renderSurgeXtAudioBuffer } from 'bluesky-text-to-audio/src/loaders/surgext';
//
//   playMixMode(source, {
//     onPlayStart: () => { /* UI更新など */ },
//     renderers: {
//       voicevox: renderVoicevoxAudioBuffer,  // Chrome拡張専用
//       surgext: renderSurgeXtAudioBuffer,    // Chrome拡張専用
//     },
//   });
//
//   // detectModeFromText のシグネチャ: (text: string) => { mode: PlayMode; cleanedText: string }
//   // mode はトラックタイプ、cleanedText はモードキーワードを除去したテキストです。
//   const { mode, cleanedText } = detectModeFromText(source);
//
// 注意: renderers を省略した場合、VOICEVOX / Surge XT トラックが含まれると実行時エラーになります。
//       YM2151 / Tone.js / mmlabc / chord トラックは Chrome拡張外でも利用可能です。

export { playMixMode } from './loaders/mix';
export type { TrackRenderers, PlayMixModeOptions } from './loaders/mix';
export { detectModeFromText } from './detectModeFromText';
export { parseTracks } from './mixParser';
export type { PlayMode } from './playModes';
export type { Track, TrackType, ChordTargetEngine } from './mixParser';
