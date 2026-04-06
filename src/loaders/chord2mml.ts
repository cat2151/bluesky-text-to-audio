// CDNからの動的ロードは bsky.app の CSP（script-src）により遮断されるため、
// このアプローチを採用する。
//
// ✅ cat2151 ライブラリ「常に main 最新版を利用すること」ポリシーについて
// このファイルが参照している ../vendor/chord2mml.mjs は、
//   https://github.com/cat2151/chord2mml
// の main ブランチから生成された「ベンダリング済み（バンドル済み）」ESM です。
//
// CSP 制約によりランタイムで CDN / raw GitHub から直接ロードせず、
// 代わりに事前バンドルした成果物を同梱しています。
// 「最新版を常に利用する」ため、../vendor/chord2mml.mjs は手動 or CI で定期的に再生成してください。
//
// 🔄 再生成手順
// 1. cat2151/chord2mml リポジトリをクローンして ESM ビルドを実行:
//      npm run build:esm
// 2. 生成された dist/chord2mml.mjs を src/vendor/chord2mml.mjs としてコピーし、
//    ファイル先頭にプロバナンスヘッダーを追記する（src/vendor/chord2mml.mjs 参照）。
// 3. 変更された src/vendor/chord2mml.mjs をコミットする。
import { chord2mml } from '../vendor/chord2mml.mjs';

export async function parseChordViaLibrary(chord: string): Promise<string> {
  return chord2mml.parse(chord);
}
