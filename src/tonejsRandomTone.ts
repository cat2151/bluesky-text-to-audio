// tonejsRandomTone.ts
// Tone.js ランダム音色生成（仮実装）
// textareaに@～によるinstrument/effect指定がない場合にランダムな音色を適用する（issue #165）

const RANDOM_TONEJS_SYNTHS = [
  '@Synth',
  '@FMSynth',
  '@AMSynth',
  '@MonoSynth',
  '@DuoSynth',
  '@PluckSynth',
  '@MembraneSynth',
  '@MetalSynth',
] as const;

/**
 * ランダムなTone.js音色（MMLプレフィックス）を生成する（仮実装）。
 */
export function generateRandomTonejsMmlPrefix(): string {
  const idx = Math.floor(Math.random() * RANDOM_TONEJS_SYNTHS.length);
  return RANDOM_TONEJS_SYNTHS[idx] as string;
}

/**
 * MMLに `@～` によるinstrumentまたはeffectの指定がない場合、ランダムな音色プレフィックスを先頭に付加する（仮実装）。
 * `@～` 指定がある場合（MMLが '/@\w+/' にマッチする場合）はそのまま返す。
 */
export function applyRandomToneToMmlIfNeeded(mml: string): string {
  if (/@\w+/.test(mml)) return mml;
  const prefix = generateRandomTonejsMmlPrefix();
  return mml ? `${prefix} ${mml}` : prefix;
}
