// CDNからの動的ロードは bsky.app の CSP（script-src）により遮断されるため、
// このアプローチを採用する。
// tone npm パッケージを静的 import し、Vite/CRXJS がビルド時にバンドルする。
import type { ToneLib } from '../types';
import * as ToneModule from 'tone';

export function loadTone(): Promise<ToneLib> {
  return Promise.resolve(ToneModule as unknown as ToneLib);
}
