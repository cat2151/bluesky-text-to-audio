import type { SequenceEvent } from '../types';

const LOG_PREFIX = '[BTA:loaders/mmlToJson]';

// tonejs-mml-to-json を CDN から動的ロード（script injection + postMessage パターン）
// cat2151ライブラリは常に最新mainを使用、バージョン固定しない
// このライブラリはESM+WASMのため、コンテンツスクリプトの isolated world から直接 import() できない。
// <script type="module"> を page DOM に注入して main world で動かし、postMessage で通信する。
const MML_TO_JSON_CDN_URL = 'https://cdn.jsdelivr.net/gh/cat2151/tonejs-mml-to-json@main/dist/index.js';

let mmlToJsonReadyPromise: Promise<void> | null = null;
let mmlToJsonRequestCounter = 0;

export function ensureMmlToJsonLoader(): Promise<void> {
  if (mmlToJsonReadyPromise) return mmlToJsonReadyPromise;
  mmlToJsonReadyPromise = new Promise<void>((resolve, reject) => {
    const expectedOrigin = window.location.origin;
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== expectedOrigin) return;
      if (e.data?.type === 'bta-mml2json-ready') {
        window.removeEventListener('message', onMessage);
        resolve();
      } else if (e.data?.type === 'bta-mml2json-load-error') {
        window.removeEventListener('message', onMessage);
        mmlToJsonReadyPromise = null;
        reject(new Error(String(e.data.error)));
      }
    };
    window.addEventListener('message', onMessage);
    const script = document.createElement('script');
    script.type = 'module';
    script.textContent = `
      import { initWasm, mml2json } from '${MML_TO_JSON_CDN_URL}';
      const _origin = window.location.origin;
      try {
        await initWasm();
        window.postMessage({ type: 'bta-mml2json-ready' }, _origin);
        window.addEventListener('message', (e) => {
          if (e.origin !== _origin) return;
          if (e.data?.type !== 'bta-mml2json-request') return;
          const { id, mml } = e.data;
          try {
            const result = mml2json(mml);
            window.postMessage({ type: 'bta-mml2json-response', id, result }, _origin);
          } catch (err) {
            window.postMessage({ type: 'bta-mml2json-response', id, error: String(err) }, _origin);
          }
        });
      } catch (err) {
        window.postMessage({ type: 'bta-mml2json-load-error', error: String(err) }, _origin);
      }
    `;
    script.onerror = () => {
      mmlToJsonReadyPromise = null;
      reject(new Error('tonejs-mml-to-json スクリプトの読み込みに失敗しました'));
    };
    document.head.appendChild(script);
  }).catch((e: unknown) => {
    console.error(LOG_PREFIX, 'tonejs-mml-to-json の読み込みに失敗しました:', e);
    return Promise.reject(e);
  });
  return mmlToJsonReadyPromise;
}

export async function parseMmlViaLibrary(mml: string): Promise<SequenceEvent[]> {
  await ensureMmlToJsonLoader();
  const id = String(++mmlToJsonRequestCounter);
  const expectedOrigin = window.location.origin;
  return new Promise<SequenceEvent[]>((resolve, reject) => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== expectedOrigin) return;
      if (e.data?.type !== 'bta-mml2json-response' || e.data.id !== id) return;
      window.removeEventListener('message', onMessage);
      if (e.data.error) {
        reject(new Error(String(e.data.error)));
      } else {
        resolve(e.data.result as SequenceEvent[]);
      }
    };
    window.addEventListener('message', onMessage);
    window.postMessage({ type: 'bta-mml2json-request', id, mml }, expectedOrigin);
  });
}
