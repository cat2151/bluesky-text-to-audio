// ---- bluesky-text-to-audio core library entry point ----
//
// このファイルは ObsidianやQuartz 4の拡張からcoreを利用するためのライブラリエントリポイントです。
//
// 使用例 (Obsidian plugin / Quartz 4 transformer):
//   import { playMixMode, detectModeFromText, parseTracks } from 'bluesky-text-to-audio/src/core';
//
//   // playMixMode のシグネチャ: (text: string, onPlayStart?: () => void) => Promise<void>
//   // mmlmix コードブロックにplayボタンを追加し、クリックで playMixMode(source) を呼ぶ。
//   btn.addEventListener('click', () => playMixMode(source));
//
//   // detectModeFromText のシグネチャ: (text: string) => { mode: PlayMode; cleanedText: string }
//   // mode はトラックタイプ、cleanedText はモードキーワードを除去したテキストです。
//   const { mode, cleanedText } = detectModeFromText(source);
//
// 注意: VOICEVOX および Surge XT トラックは chrome.runtime.sendMessage を使用するため、
//       Chrome拡張のコンテキスト外では利用できません。
//       これらのモジュールはビルド時に chrome グローバルへの参照を含むため、
//       TypeScript で利用する際は @types/chrome が必要です（未使用時もバンドルに含まれます）。
//       YM2151 / Tone.js / mmlabc / chord トラックは Chrome拡張外でも利用可能です。

// playMixMode は loaders/mix から直接エクスポートします。
// シグネチャ: (text: string, onPlayStart?: () => void) => Promise<void>
export { playMixMode } from './loaders/mix';
export { detectModeFromText } from './detectModeFromText';
export { parseTracks } from './mixParser';
export type { PlayMode } from './playModes';
export type { Track, TrackType, ChordTargetEngine } from './mixParser';
