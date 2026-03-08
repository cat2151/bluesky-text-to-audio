import type { SequenceEvent } from '../types';
// tonejs-mml-to-json をベンダリング済みローカルファイルから静的 import する。
// CDN からの動的ロードは bsky.app の CSP（script-src 'self'）により遮断されるため、
// このライブラリは src/tonejs-mml-to-json/ に同梱し、静的 import でロードする。
// コンテンツスクリプトの isolated world は拡張機能の CSP が適用されるため、
// WASM の実行（wasm-unsafe-eval）が許可されており、このアプローチが正しく動作する。
// cat2151ライブラリは常に最新mainを使用、バージョン固定しない。
// 最新版への追従: src/tonejs-mml-to-json/ 配下のファイルをアップストリームから再ダウンロードする。
import { initWasm, mml2json as mml2jsonLib } from '../tonejs-mml-to-json/dist/index.js';

const LOG_PREFIX = '[BTA:loaders/mmlToJson]';

let wasmInitPromise: Promise<void> | null = null;

function ensureWasmInit(): Promise<void> {
  if (!wasmInitPromise) {
    wasmInitPromise = initWasm().catch((e: unknown) => {
      console.error(LOG_PREFIX, 'WASM初期化に失敗しました:', e);
      wasmInitPromise = null;
      throw e;
    });
  }
  return wasmInitPromise;
}

export async function parseMmlViaLibrary(mml: string): Promise<SequenceEvent[]> {
  await ensureWasmInit();
  return mml2jsonLib(mml) as unknown as SequenceEvent[];
}
