// YM2151 playback loader
// Uses <script type="module"> injection + postMessage pattern (same as mmlToJson.ts)
// to run in the page's main world and bypass extension CSP.
// Pipeline: MML → (web-tree-sitter + mmlabc-to-smf-wasm) → SMF
//         → (smf-to-ym2151log-rust WASM) → YM2151 log JSON
//         → (ym2151.js Emscripten WASM + Web Audio API) → audio playback
// cat2151ライブラリは常に最新mainを使用、バージョン固定しない

const LOG_PREFIX = '[BTA:loaders/ym2151]';

const WEB_TREE_SITTER_URL = 'https://cat2151.github.io/mmlabc-to-smf-rust/demo/web-tree-sitter.js';
const MML_TO_SMF_URL = 'https://cat2151.github.io/mmlabc-to-smf-rust/mmlabc-to-smf-wasm/pkg/mmlabc_to_smf_wasm.js';
const MML_LANGUAGE_URL = 'https://cat2151.github.io/mmlabc-to-smf-rust/tree-sitter-mml/tree-sitter-mml.wasm';
const SMF_TO_YM2151_URL = 'https://cat2151.github.io/smf-to-ym2151log-rust/pkg/smf_to_ym2151log.js';
const YM2151_JS_URL = 'https://cat2151.github.io/web-ym2151/ym2151.js';

// Piano-like preset tone (Acoustic Grand Piano, MIDI program 0)
// Based on tones/000.json from smf-to-ym2151log-rust, wrapped in attachment format.
// CON=7 (all 4 operators as carriers, parallel), stereo output.
// This is the raw JS object — JSON.stringify is called inside the injected script.
const PIANO_PRESET_ATTACHMENT_OBJ = [
  {
    ProgramChange: 0,
    Tone: {
      events: [
        { time: 0.0, addr: '0x20', data: '0xC7' },
        { time: 0.0, addr: '0x38', data: '0x00' },
        { time: 0.0, addr: '0x40', data: '0x01' },
        { time: 0.0, addr: '0x60', data: '0x00' },
        { time: 0.0, addr: '0x80', data: '0x1F' },
        { time: 0.0, addr: '0xA0', data: '0x05' },
        { time: 0.0, addr: '0xC0', data: '0x05' },
        { time: 0.0, addr: '0xE0', data: '0xF7' },
        { time: 0.0, addr: '0x48', data: '0x01' },
        { time: 0.0, addr: '0x68', data: '0x7F' },
        { time: 0.0, addr: '0x88', data: '0x1F' },
        { time: 0.0, addr: '0xA8', data: '0x05' },
        { time: 0.0, addr: '0xC8', data: '0x05' },
        { time: 0.0, addr: '0xE8', data: '0xF7' },
        { time: 0.0, addr: '0x50', data: '0x01' },
        { time: 0.0, addr: '0x70', data: '0x7F' },
        { time: 0.0, addr: '0x90', data: '0x1F' },
        { time: 0.0, addr: '0xB0', data: '0x05' },
        { time: 0.0, addr: '0xD0', data: '0x05' },
        { time: 0.0, addr: '0xF0', data: '0xF7' },
        { time: 0.0, addr: '0x58', data: '0x01' },
        { time: 0.0, addr: '0x78', data: '0x7F' },
        { time: 0.0, addr: '0x98', data: '0x1F' },
        { time: 0.0, addr: '0xB8', data: '0x05' },
        { time: 0.0, addr: '0xD8', data: '0x05' },
        { time: 0.0, addr: '0xF8', data: '0xF7' },
      ],
    },
  },
];

let ym2151LoaderPromise: Promise<void> | null = null;
let ym2151RequestCounter = 0;
// 30 seconds covers the first-time WASM + tree-sitter library download/initialization
const YM2151_RESPONSE_TIMEOUT_MS = 30000;

export function ensureYm2151Loader(): Promise<void> {
  if (ym2151LoaderPromise) return ym2151LoaderPromise;
  ym2151LoaderPromise = new Promise<void>((resolve, reject) => {
    const expectedOrigin = window.location.origin;
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== expectedOrigin) return;
      if (e.data?.type === 'bta-ym2151-ready') {
        window.removeEventListener('message', onMessage);
        resolve();
      } else if (e.data?.type === 'bta-ym2151-load-error') {
        window.removeEventListener('message', onMessage);
        ym2151LoaderPromise = null;
        reject(new Error(String(e.data.error)));
      }
    };
    window.addEventListener('message', onMessage);

    // Embed constants into the injected script via template literals.
    // This script runs in the page's main world (bypasses extension CSP).
    // Use a Blob URL instead of script.textContent to avoid bsky.app's CSP
    // blocking inline scripts (script-src does not allow 'unsafe-inline').
    const scriptContent = `
      const _origin = window.location.origin;
      // YM2151 emulator constants (must match WASM side)
      const OPM_CLOCK = 3579545;
      const CLOCK_STEP = 64;
      const OPM_SAMPLE_RATE = OPM_CLOCK / CLOCK_STEP; // ~55930.4 Hz

      // Piano preset embedded as a JS object literal; JSON.stringify is called below
      // to produce the UTF-8 attachment bytes expected by smf_to_ym2151_json_with_attachment.
      const PIANO_PRESET_ATTACHMENT = JSON.stringify(${JSON.stringify(PIANO_PRESET_ATTACHMENT_OBJ)});
      const YM2151_JS_URL = ${JSON.stringify(YM2151_JS_URL)};
      const WEB_TREE_SITTER_URL = ${JSON.stringify(WEB_TREE_SITTER_URL)};
      const MML_TO_SMF_URL = ${JSON.stringify(MML_TO_SMF_URL)};
      const MML_LANGUAGE_URL = ${JSON.stringify(MML_LANGUAGE_URL)};
      const SMF_TO_YM2151_URL = ${JSON.stringify(SMF_TO_YM2151_URL)};

      // Set up the Emscripten Module global BEFORE loading ym2151.js.
      // (Emscripten reads window.Module on startup and calls onRuntimeInitialized when ready.)
      // We save and restore the previous handler so we don't permanently override it.
      let _resolveYm2151;
      const _ym2151ReadyPromise = new Promise(r => { _resolveYm2151 = r; });
      if (!window.Module) window.Module = {};
      const _prevOnRuntime = window.Module.onRuntimeInitialized;
      window.Module.onRuntimeInitialized = function() {
        // Restore the previous handler so we don't hold this closure indefinitely
        window.Module.onRuntimeInitialized = _prevOnRuntime;
        if (typeof _prevOnRuntime === 'function') _prevOnRuntime();
        _resolveYm2151();
      };

      // Inject ym2151.js as a regular (non-module) script and wait for load
      function loadYm2151Script() {
        return new Promise((resolve, reject) => {
          if (document.querySelector('script[data-bta-ym2151]')) {
            // Already injected — WASM may already be initialized
            if (typeof Module !== 'undefined' && Module._generate_sound) {
              _resolveYm2151(); // resolve in case it already initialized
            }
            resolve(undefined);
            return;
          }
          const s = document.createElement('script');
          s.setAttribute('data-bta-ym2151', '');
          s.src = YM2151_JS_URL;
          s.onload = () => resolve(undefined);
          s.onerror = () => reject(new Error('ym2151.js の読み込みに失敗しました'));
          document.body.appendChild(s);
        });
      }

      // Convert tree-sitter parse tree node to JSON (same helper as demo-library)
      function treeToJson(node, source) {
        const result = { type: node.type, text: source.substring(node.startIndex, node.endIndex) };
        if (node.childCount > 0) {
          result.children = [];
          for (let i = 0; i < node.childCount; i++) {
            result.children.push(treeToJson(node.child(i), source));
          }
        }
        return result;
      }

      // Generate audio from YM2151 log JSON and play it via Web Audio API
      // Reuse a single AudioContext across play calls (browsers limit the total count)
      let sharedAudioContext = null;
      function getAudioContext() {
        if (!sharedAudioContext || sharedAudioContext.state === 'closed') {
          sharedAudioContext = new AudioContext();
        }
        return sharedAudioContext;
      }

      function generateAndPlay(ym2151LogJson) {
        const data = JSON.parse(ym2151LogJson);
        if (data.error) throw new Error(data.error);
        const events = data.events;
        if (!events || !Array.isArray(events) || events.length === 0) {
          throw new Error('YM2151 log に events がありません');
        }

        // Use a loop instead of Math.max(...spread) to avoid the argument-count limit
        // for large event arrays.
        let maxTime = -Infinity;
        for (let i = 0; i < events.length; i++) {
          const t = parseFloat(events[i].time);
          if (t > maxTime) maxTime = t;
        }
        const durationSec = maxTime + 0.5; // extra tail
        const numFrames = Math.floor(durationSec * OPM_SAMPLE_RATE);

        // Struct layout (must match C): float time (4 bytes) + uint8 addr (1) + uint8 data (1) + padding (2) = 8
        const STRUCT_SIZE = 8;
        const dataPtr = Module._malloc(events.length * STRUCT_SIZE);
        const view = new DataView(Module.HEAPU8.buffer);
        events.forEach((evt, i) => {
          const baseAddr = dataPtr + i * STRUCT_SIZE;
          view.setFloat32(baseAddr, parseFloat(evt.time), true); // little-endian float32
          // parseInt auto-detects the 0x prefix and parses as base-16 (same as web-ym2151/audioGenerator.ts)
          Module.HEAPU8[baseAddr + 4] = parseInt(evt.addr); // 0x-prefixed hex string
          Module.HEAPU8[baseAddr + 5] = parseInt(evt.data);
        });

        const actualFrames = Module._generate_sound(dataPtr, events.length, numFrames);
        Module._free(dataPtr);
        if (actualFrames <= 0) throw new Error('YM2151 audio generation に失敗しました');

        // web-ym2151 exposes the audio buffer via Module._get_buffer_ptr() (added in upstream).
        // We copy the interleaved stereo float32 data from WASM memory in one subarray call,
        // avoiding the per-sample JS↔WASM boundary crossings that would freeze the UI.
        const bufPtr = Module._get_buffer_ptr();
        // bufPtr is a byte address; >>2 converts to Float32Array index.
        const interleaved = Module.HEAPF32.subarray(bufPtr >> 2, (bufPtr >> 2) + actualFrames * 2);
        const left = new Float32Array(actualFrames);
        const right = new Float32Array(actualFrames);
        for (let i = 0; i < actualFrames; i++) {
          left[i] = interleaved[i * 2];
          right[i] = interleaved[i * 2 + 1];
        }
        Module._free_buffer();

        const audioCtx = getAudioContext();
        if (audioCtx.state === 'suspended') {
          // resume() can fail if the user hasn't interacted with the page yet;
          // the AudioContext will auto-resume when start() is called after a user gesture.
          audioCtx.resume().catch(() => {});
        }
        const audioBuffer = audioCtx.createBuffer(2, actualFrames, OPM_SAMPLE_RATE);
        audioBuffer.getChannelData(0).set(left);
        audioBuffer.getChannelData(1).set(right);
        const source = audioCtx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioCtx.destination);
        source.onended = () => { source.disconnect(); };
        source.start();
      }

      // Lazy-initialize all libraries on first play request
      let _libsPromise = null;
      async function ensureLibs() {
        if (_libsPromise) return _libsPromise;
        _libsPromise = (async () => {
          await loadYm2151Script();
          await _ym2151ReadyPromise;
          const [treeSitterModule, mmlSmfModule, smfYm2151Module] = await Promise.all([
            import(WEB_TREE_SITTER_URL),
            import(MML_TO_SMF_URL),
            import(SMF_TO_YM2151_URL),
          ]);
          await treeSitterModule.Parser.init();
          const parser = new treeSitterModule.Parser();
          const lang = await treeSitterModule.Language.load(MML_LANGUAGE_URL);
          parser.setLanguage(lang);
          await mmlSmfModule.default();    // init mmlabc-to-smf WASM
          await smfYm2151Module.default(); // init smf-to-ym2151log WASM
          return {
            parser,
            parseTreeJsonToSmf: mmlSmfModule.parse_tree_json_to_smf,
            smfToYm2151: smfYm2151Module.smf_to_ym2151_json_with_attachment,
          };
        })().catch(e => { _libsPromise = null; throw e; });
        return _libsPromise;
      }

      try {
        // Signal ready immediately — library loading is lazy on first play
        window.postMessage({ type: 'bta-ym2151-ready' }, _origin);

        // Listen for play requests from the content script
        window.addEventListener('message', async (e) => {
          if (e.origin !== _origin) return;
          if (e.data?.type !== 'bta-ym2151-play') return;
          const { id, mml } = e.data;
          try {
            const { parser, parseTreeJsonToSmf, smfToYm2151 } = await ensureLibs();
            // MML → parse tree → SMF bytes
            const tree = parser.parse(mml);
            const treeJson = JSON.stringify(treeToJson(tree.rootNode, mml));
            const smfResult = parseTreeJsonToSmf(treeJson, mml);
            const smfUint8 = smfResult instanceof Uint8Array ? smfResult : new Uint8Array(smfResult);
            // SMF + piano tone attachment → YM2151 log JSON
            const attachmentBytes = new TextEncoder().encode(PIANO_PRESET_ATTACHMENT);
            const ym2151LogJson = smfToYm2151(smfUint8, attachmentBytes);
            // YM2151 log JSON → audio → play
            generateAndPlay(ym2151LogJson);
            window.postMessage({ type: 'bta-ym2151-response', id, success: true }, _origin);
          } catch (err) {
            window.postMessage({ type: 'bta-ym2151-response', id, success: false, error: String(err) }, _origin);
          }
        });
      } catch (err) {
        window.postMessage({ type: 'bta-ym2151-load-error', error: String(err) }, _origin);
      }
    `;
    const blob = new Blob([scriptContent], { type: 'text/javascript' });
    const blobUrl = URL.createObjectURL(blob);
    const script = document.createElement('script');
    script.type = 'module';
    script.src = blobUrl;
    script.onerror = () => {
      URL.revokeObjectURL(blobUrl);
      ym2151LoaderPromise = null;
      reject(new Error('YM2151 ローダースクリプトの注入に失敗しました'));
    };
    script.onload = () => URL.revokeObjectURL(blobUrl);
    document.head.appendChild(script);
  }).catch((e: unknown) => {
    console.error(LOG_PREFIX, 'YM2151 ローダーの初期化に失敗しました:', e);
    return Promise.reject(e);
  });
  return ym2151LoaderPromise;
}

export async function playWithYm2151(mml: string): Promise<void> {
  await ensureYm2151Loader();
  const id = String(++ym2151RequestCounter);
  const expectedOrigin = window.location.origin;
  return new Promise<void>((resolve, reject) => {
    const timeoutMs = YM2151_RESPONSE_TIMEOUT_MS;
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== expectedOrigin) return;
      if (e.data?.type !== 'bta-ym2151-response' || e.data.id !== id) return;
      window.removeEventListener('message', onMessage);
      clearTimeout(timeoutId);
      if (e.data?.success === true) {
        resolve();
      } else {
        const message = e.data?.error
          ? String(e.data.error)
          : 'YM2151 playback failed for an unknown reason';
        reject(new Error(message));
      }
    };
    const timeoutId = window.setTimeout(() => {
      window.removeEventListener('message', onMessage);
      reject(new Error('YM2151 response timed out'));
    }, timeoutMs);
    window.addEventListener('message', onMessage);
    window.postMessage({ type: 'bta-ym2151-play', id, mml }, expectedOrigin);
  });
}
