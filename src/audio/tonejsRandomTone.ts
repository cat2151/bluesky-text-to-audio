// tonejsRandomTone.ts
// Tone.js ランダム音色生成
// textareaに@～によるinstrument/effect指定がない場合にランダムな音色を適用する（issue #165）
// cat2151/tonejs-mml-to-json のランダム音色ライブラリを使用（issue #173）

import { randomInstrumentAndEffectMml } from '../vendor/tonejs-mml-to-json/dist/random-instrument.js';

/**
 * ランダムなTone.js音色（MMLプレフィックス）を生成する。
 * instrument と effect を合体したMMLを1つの文字列で返す。
 */
export function generateRandomTonejsMmlPrefix(): string {
  const { instrument, effect } = randomInstrumentAndEffectMml();
  return effect ? `${instrument} ${effect}` : instrument;
}

/**
 * MMLに `@～` によるinstrumentまたはeffectの指定がない場合、ランダムな音色プレフィックスを先頭に付加する。
 * `@～` 指定がある場合（MMLが '/@\w+/' にマッチする場合）はそのまま返す。
 */
export function applyRandomToneToMmlIfNeeded(mml: string): string {
  if (/@\w+/.test(mml)) return mml;
  const prefix = generateRandomTonejsMmlPrefix();
  return mml ? `${prefix} ${mml}` : prefix;
}
