const LOG_PREFIX = '[BTA:loaders/chord2mml]';

// chord2mml を CDN から動的ロード（cat2151ライブラリは常に最新mainを使用、バージョン固定しない）
// new Function() はコンテンツスクリプトの CSP (unsafe-eval 不可) に違反するため、
// <script> を page の main world に注入し postMessage で通信するパターンを使用する。
const CHORD2MML_CDN_URL = 'https://cdn.jsdelivr.net/gh/cat2151/chord2mml@main/dist/chord2mml.js';

let chord2mmlReadyPromise: Promise<void> | null = null;
let chord2mmlRequestCounter = 0;

export function ensureChord2mmlLoader(): Promise<void> {
  if (chord2mmlReadyPromise) return chord2mmlReadyPromise;
  chord2mmlReadyPromise = new Promise<void>((resolve, reject) => {
    const expectedOrigin = window.location.origin;
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== expectedOrigin) return;
      if (e.data?.type === 'bta-chord2mml-ready') {
        window.removeEventListener('message', onMessage);
        resolve();
      } else if (e.data?.type === 'bta-chord2mml-load-error') {
        window.removeEventListener('message', onMessage);
        chord2mmlReadyPromise = null;
        reject(new Error(String(e.data.error)));
      }
    };
    window.addEventListener('message', onMessage);
    const script = document.createElement('script');
    script.type = 'module';
    script.textContent = `
      const _origin = window.location.origin;
      try {
        await new Promise((res, rej) => {
          const s = document.createElement('script');
          s.src = '${CHORD2MML_CDN_URL}';
          s.onload = res;
          s.onerror = () => rej(new Error('chord2mml script load failed'));
          document.head.appendChild(s);
        });
        if (!window.chord2mml) throw new Error('chord2mml not found on window after load');
        window.postMessage({ type: 'bta-chord2mml-ready' }, _origin);
        window.addEventListener('message', (e) => {
          if (e.origin !== _origin) return;
          if (e.data?.type !== 'bta-chord2mml-request') return;
          const { id, chord } = e.data;
          try {
            const result = window.chord2mml.parse(chord);
            window.postMessage({ type: 'bta-chord2mml-response', id, result }, _origin);
          } catch (err) {
            window.postMessage({ type: 'bta-chord2mml-response', id, error: String(err) }, _origin);
          }
        });
      } catch (err) {
        window.postMessage({ type: 'bta-chord2mml-load-error', error: String(err) }, _origin);
      }
    `;
    script.onerror = () => {
      chord2mmlReadyPromise = null;
      reject(new Error('chord2mml モジュールスクリプトの読み込みに失敗しました'));
    };
    document.head.appendChild(script);
  }).catch((e: unknown) => {
    console.error(LOG_PREFIX, 'chord2mml の読み込みに失敗しました:', e);
    return Promise.reject(e);
  });
  return chord2mmlReadyPromise;
}

export async function parseChordViaLibrary(chord: string): Promise<string> {
  await ensureChord2mmlLoader();
  const id = String(++chord2mmlRequestCounter);
  const expectedOrigin = window.location.origin;
  return new Promise<string>((resolve, reject) => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== expectedOrigin) return;
      if (e.data?.type !== 'bta-chord2mml-response' || e.data.id !== id) return;
      window.removeEventListener('message', onMessage);
      if (e.data.error) {
        reject(new Error(String(e.data.error)));
      } else {
        resolve(e.data.result as string);
      }
    };
    window.addEventListener('message', onMessage);
    window.postMessage({ type: 'bta-chord2mml-request', id, chord }, expectedOrigin);
  });
}
