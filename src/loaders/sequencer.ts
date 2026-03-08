// CDNからの動的ロードは bsky.app の CSP（script-src）により遮断されるため、
// このアプローチを採用する。
//
// ✅ cat2151 ライブラリ「常に main 最新版を利用すること」ポリシーについて
// このファイルが参照している ../tonejs-json-sequencer.mjs は、
//   https://github.com/cat2151/tonejs-json-sequencer
// の main ブランチから生成された「ベンダリング済み（バンドル済み）」ESM です。
//
// CSP 制約によりランタイムで CDN / raw GitHub から直接ロードせず、
// 代わりに事前バンドルした成果物を同梱しています。
// 「最新版を常に利用する」ため、../tonejs-json-sequencer.mjs は CI で定期的に再生成してください。
import type { SequencerLib } from '../types';
import { SequencerNodes, playSequence } from '../tonejs-json-sequencer.mjs';

export function loadSequencer(): Promise<SequencerLib> {
  return Promise.resolve({ SequencerNodes, playSequence } as SequencerLib);
}
