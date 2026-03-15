// ---- bluesky-text-to-audio core library entry point ----
//
// このファイルは ObsidianやQuartz 4の拡張からcoreを利用するためのライブラリエントリポイントです。
//
// 使用例 (Obsidian plugin):
//   import { playMixMode } from 'bluesky-text-to-audio/src/core';
//   // mmlmix コードブロックにplayボタンを追加し、クリックで playMixMode(source) を呼ぶ。
//
// 使用例 (Quartz 4 transformer):
//   import { playMixMode } from 'bluesky-text-to-audio/src/core';
//   // mmlmix コードブロックをHTMLのplayボタンに変換し、クリックで playMixMode(source) を呼ぶ。
//
// 注意: VOICEVOX トラックは chrome.runtime.sendMessage を使用するため、
//       Chrome拡張のコンテキスト外では利用できません。
//       YM2151 / Tone.js / mmlabc / chord / Surge XT トラックは利用可能です。

export { playMixMode } from './playModeHandlers';
export { detectModeFromText } from './detectModeFromText';
export { parseTracks } from './mixParser';
export type { PlayMode } from './playModes';
export type { Track, TrackType, ChordTargetEngine } from './mixParser';
