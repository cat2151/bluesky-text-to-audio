import type { Chord2mmlLib } from '../types';

const LOG_PREFIX = '[BTA:loaders/chord2mml]';

// chord2mml を CDN から動的ロード（cat2151ライブラリは常に最新mainを使用、バージョン固定しない）
const CHORD2MML_CDN_URL = 'https://cdn.jsdelivr.net/gh/cat2151/chord2mml/dist/chord2mml.js';

export const chord2mmlPromise: Promise<Chord2mmlLib> = fetch(CHORD2MML_CDN_URL)
  .then(resp => resp.text())
  .then(code => {
    // UMD バンドルを Function スコープで実行し chord2mml オブジェクトを取得
    const fn = new Function(`const self={};\n${code}\nreturn self.chord2mml;`);
    return fn() as Chord2mmlLib;
  })
  .catch((e: unknown) => {
    console.error(LOG_PREFIX, 'chord2mml の読み込みに失敗しました:', e);
    return Promise.reject(e);
  });
