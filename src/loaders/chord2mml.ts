import type { Chord2mmlLib } from '../types';

const LOG_PREFIX = '[BTA:loaders/chord2mml]';

// chord2mml を CDN から動的ロード（cat2151ライブラリは常に最新mainを使用、バージョン固定しない）
const CHORD2MML_CDN_URL = 'https://cdn.jsdelivr.net/gh/cat2151/chord2mml@main/dist/chord2mml.js';

let chord2mmlPromise: Promise<Chord2mmlLib> | null = null;

export function loadChord2mml(): Promise<Chord2mmlLib> {
  if (!chord2mmlPromise) {
    chord2mmlPromise = fetch(CHORD2MML_CDN_URL)
      .then(resp => resp.text())
      .then(code => {
        // UMD バンドルをグローバルスコープで実行し globalThis.chord2mml にエクスポートされる
        new Function(code)();
        const chord2mml = (globalThis as Record<string, unknown>)['chord2mml'] as Chord2mmlLib | undefined;
        if (!chord2mml) throw new Error('chord2mml の読み込みに失敗しました');
        return chord2mml;
      })
      .catch((e: unknown) => {
        console.error(LOG_PREFIX, 'chord2mml の読み込みに失敗しました:', e);
        chord2mmlPromise = null;
        return Promise.reject(e);
      });
  }
  return chord2mmlPromise;
}
