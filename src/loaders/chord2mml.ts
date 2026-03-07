// CDNからの動的ロードは bsky.app の CSP（script-src）により遮断されるため、
// このアプローチを採用する。
//
// ✅ cat2151 ライブラリ「常に main 最新版を利用すること」ポリシーについて
// このファイルが参照している ../chord2mml.mjs は、
//   https://github.com/cat2151/chord2mml
// の main ブランチから生成された「ベンダリング済み（バンドル済み）」ESM です。
//
// CSP 制約によりランタイムで CDN / raw GitHub から直接ロードせず、
// 代わりに事前バンドルした成果物を同梱しています。
// 「最新版を常に利用する」ため、../chord2mml.mjs は手動 or CI で定期的に再生成してください。
//
// 🔄 再生成手順（一例）
// 1. peggy で chord2mml_chord2ast.pegjs を ESM 形式でビルド:
//      npx peggy ./peggyjs/chord2mml_chord2ast.pegjs --output ./src/chord2mml_chord2ast.mjs --format es
//    （peggyjs/ と src/ は cat2151/chord2mml の構成に対応）
// 2. esbuild で全モジュールをバンドル:
//      npx esbuild src/chord2mml.ts --bundle --format=esm --outfile=dist/chord2mml.mjs --platform=browser
// 3. 生成された dist/chord2mml.mjs を src/chord2mml.mjs としてコピーし、
//    ファイル先頭にプロバナンスヘッダーを追記する（src/chord2mml.mjs 参照）。
// 4. 変更された src/chord2mml.mjs をコミットする。
//
// 上記手順を CI（スケジュール実行）やローカルスクリプトに組み込むことで、
// vendored コピーが main からドリフトしないように運用してください。
import { chord2mml } from '../chord2mml.mjs';

export async function parseChordViaLibrary(chord: string): Promise<string> {
  return chord2mml.parse(chord);
}
