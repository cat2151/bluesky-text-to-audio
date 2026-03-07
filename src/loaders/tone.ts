import type { ToneLib } from '../types';

const LOG_PREFIX = '[BTA:loaders/tone]';

// Tone.js を CDN から動的ロード（cat2151ライブラリは常に最新mainを使用、バージョン固定しない）
const TONE_CDN_URL = 'https://cdn.jsdelivr.net/npm/tone@15/build/Tone.js';

let tonePromise: Promise<ToneLib> | null = null;

export function loadTone(): Promise<ToneLib> {
  if (!tonePromise) {
    tonePromise = fetch(TONE_CDN_URL)
      .then(resp => resp.text())
      .then(code => {
        // UMDビルドをFunction内で実行し、self.Tone（グローバル）にエクスポートされる
        new Function(code)();
        const Tone = (globalThis as Record<string, unknown>)['Tone'] as ToneLib | undefined;
        if (!Tone) throw new Error('Tone.js の読み込みに失敗しました');
        return Tone;
      })
      .catch((e: unknown) => {
        console.error(LOG_PREFIX, 'Tone.js の読み込みに失敗しました:', e);
        tonePromise = null;
        return Promise.reject(e);
      });
  }
  return tonePromise;
}
