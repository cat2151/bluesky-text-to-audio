// YM2151 playback loader — vendored version (no CDN / external URLs)
// All libraries are loaded from extension-local files bundled by Vite/CRXJS.
// The entire pipeline runs in the content script's isolated world.
//
// Pipeline:
//   MML → (web-tree-sitter + mmlabc tree-sitter-mml.wasm) → parse tree JSON
//       → (mmlabc-to-smf-wasm WASM) → SMF binary
//       → (smf-to-ym2151log-rust WASM + random tone attachment) → YM2151 log JSON
//       → (ym2151.wasm via WebAssembly.instantiate + Web Audio API) → audio
//
// cat2151ライブラリは常に最新mainを使用、バージョン固定しない。
// 最新版への追従: 各 src/ サブディレクトリのファイルをアップストリームから再ダウンロードする。

import { Parser, Language, type SyntaxNode } from '../tonejs-mml-to-json/dist/web-tree-sitter.js';
import mmlabcInit, { parse_tree_json_to_smf } from '../mmlabc-to-smf-wasm/pkg/mmlabc_to_smf_wasm.js';
import smfYm2151Init, { smf_to_ym2151_json_with_attachment } from '../smf-to-ym2151log-rust/pkg/smf_to_ym2151log.js';
import treeSitterMmlUrl from '../mmlabc-tree-sitter-mml/tree-sitter-mml.wasm?url';
import ym2151WasmUrl from '../web-ym2151/ym2151.wasm?url';
import { generateRandomToneAttachment, type ToneAttachmentEntry } from '../ym2151RandomTone';

const LOG_PREFIX = '[BTA:loaders/ym2151]';

// YM2151 WASM export interface.
// Export names (b, c, d, ...) come from ym2151.js's assignWasmExports function and map to:
//   b → memory,  c → initRuntime,  d → _generate_sound,  e → _free,
//   f → _malloc,  g → _get_buffer_ptr,  h → _free_buffer
// We bypass loading ym2151.js as an ES module because when imported as a module,
// `var Module` is hoisted and cannot be pre-configured via window.Module.
// Direct WebAssembly.instantiate() avoids this issue.
interface Ym2151WasmExports {
  b: WebAssembly.Memory;
  c: () => void;
  d: (dataPtr: number, eventsLen: number, numFrames: number) => number;
  e: (ptr: number) => void;
  f: (size: number) => number;
  g: () => number;
  h: () => void;
}

interface Libs {
  parser: InstanceType<typeof Parser>;
  ym2151Memory: WebAssembly.Memory;
  malloc: (size: number) => number;
  free: (ptr: number) => void;
  generate_sound: (dataPtr: number, eventsLen: number, numFrames: number) => number;
  get_buffer_ptr: () => number;
  free_buffer: () => void;
}

let libsPromise: Promise<Libs> | null = null;

async function ensureLibs(): Promise<Libs> {
  if (libsPromise) return libsPromise;
  libsPromise = (async (): Promise<Libs> => {
    // web-tree-sitter.Parser.init() is idempotent; safe to call even if already
    // initialized by the tonejs-mml-to-json pipeline (mmlToJson.ts).
    await Parser.init();

    // Create a separate parser instance for the mmlabc MML grammar.
    // Resolve the ?url import against import.meta.url (extension origin) so that
    // Language.load() fetches from chrome-extension://... rather than
    // the page origin (bsky.app), which would 404.
    const parser = new Parser();
    const lang: Language = await Language.load(
      new URL(treeSitterMmlUrl, import.meta.url).href,
    );
    parser.setLanguage(lang);

    // Initialize wasm-pack modules (idempotent after first call).
    await mmlabcInit();
    await smfYm2151Init();

    // Instantiate ym2151.wasm directly (bypass ym2151.js ES-module loading issue).
    // ym2151.js's only WASM import is 'a.a' (_emscripten_resize_heap); we provide a
    // stub that throws on OOM. Memory growth is not expected for typical MML inputs
    // because the WASM is built with a fixed heap. If hit, it signals that the input
    // MML is unusually large or complex, and a meaningful error is preferable to a
    // silent crash. The OPM sample rate cap (numFrames limit) further bounds usage.
    //
    // Resolve the ?url import to an extension-origin URL. In a content script the
    // raw Vite ?url value is an absolute path (/assets/...) which would resolve
    // against the page origin (bsky.app) and fail. Use chrome.runtime.getURL when
    // available, falling back to new URL(path, import.meta.url) as a safe default.
    const ym2151WasmRequestUrl =
      typeof chrome !== 'undefined' && chrome.runtime && typeof chrome.runtime.getURL === 'function'
        ? chrome.runtime.getURL(ym2151WasmUrl)
        : new URL(ym2151WasmUrl, import.meta.url).toString();
    const response = await fetch(ym2151WasmRequestUrl);
    if (!response.ok) {
      throw new Error(
        `${LOG_PREFIX} Failed to load YM2151 WASM from "${ym2151WasmRequestUrl}": ` +
          `HTTP ${response.status} ${response.statusText}`,
      );
    }
    const buffer = await response.arrayBuffer();
    const imports = {
      a: {
        a: (_requestedSize: number): void => {
          throw new Error('YM2151 WASM: out of memory');
        },
      },
    };
    const { instance } = await WebAssembly.instantiate(buffer, imports);
    const exps = instance.exports as unknown as Ym2151WasmExports;
    // Call Emscripten's initRuntime (wasmExports["c"]) to set up the stack.
    exps.c();

    return {
      parser,
      ym2151Memory: exps.b,
      malloc: exps.f,
      free: exps.e,
      generate_sound: exps.d,
      get_buffer_ptr: exps.g,
      free_buffer: exps.h,
    };
  })().catch((e: unknown) => {
    console.error(LOG_PREFIX, 'ライブラリ初期化に失敗しました:', e);
    libsPromise = null;
    throw e;
  });
  return libsPromise;
}

// Convert a web-tree-sitter parse tree node to a plain JSON-serializable object.
// Matches the treeToJSON helper in mmlabc-to-smf-rust/demo/src/treeToJSON.ts.
function treeToJson(node: SyntaxNode, source: string): object {
  const result: { type: string; text: string; children?: object[] } = {
    type: node.type,
    text: source.substring(node.startIndex, node.endIndex),
  };
  if (node.childCount > 0) {
    result.children = [];
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child) result.children.push(treeToJson(child, source));
    }
  }
  return result;
}

let sharedAudioContext: AudioContext | null = null;
function getAudioContext(): AudioContext {
  if (!sharedAudioContext || sharedAudioContext.state === 'closed') {
    sharedAudioContext = new AudioContext();
  }
  return sharedAudioContext;
}

// ---- 現在再生中のソースノード（多重再生防止） ----
let currentSource: AudioBufferSourceNode | null = null;

// ---- WAVデータキャッシュ（MMLテキストとトーン文字列をkeyとして保持） ----
// YM2151のAudioBufferはサイズが大きくなりやすいため、エントリ数に上限を設けて古いものから破棄する。
const MAX_AUDIO_CACHE_ENTRIES = 32;

class BoundedMap<K, V> extends Map<K, V> {
  override set(key: K, value: V): this {
    if (this.size >= MAX_AUDIO_CACHE_ENTRIES) {
      const oldestKey = this.keys().next().value as K | undefined;
      if (oldestKey !== undefined) {
        this.delete(oldestKey);
      }
    }
    return super.set(key, value);
  }
}

const audioCache = new BoundedMap<string, AudioBuffer>();

// 外部から明示的にキャッシュをクリアしたい場合のフック
export function clearYm2151AudioCache(): void {
  audioCache.clear();
}

// ---- MML → AudioBuffer（キャッシュ付き、再生なし） ----
async function generateYm2151AudioBuffer(mml: string, attachment: ToneAttachmentEntry[], toneString: string): Promise<AudioBuffer> {
  const cacheKey = mml + '\x00' + toneString;
  let audioBuffer = audioCache.get(cacheKey);
  if (!audioBuffer) {
    const { parser, ym2151Memory, malloc, free, generate_sound, get_buffer_ptr, free_buffer } =
      await ensureLibs();

    // MML → parse tree → parse tree JSON
    const tree = parser.parse(mml);
    const treeJson = JSON.stringify(treeToJson(tree.rootNode, mml));

    // Parse tree JSON → SMF binary
    const smfData = parse_tree_json_to_smf(treeJson, mml);
    const smfUint8 = smfData instanceof Uint8Array ? smfData : new Uint8Array(smfData);

    // SMF binary + random tone attachment → YM2151 log JSON
    const attachmentStr = JSON.stringify(attachment);
    const attachmentBytes = new TextEncoder().encode(attachmentStr);
    const ym2151LogJson = smf_to_ym2151_json_with_attachment(smfUint8, attachmentBytes);

    // Parse YM2151 log
    const data = JSON.parse(ym2151LogJson) as {
      error?: string;
      events?: Array<{ time: string; addr: string; data: string }>;
    };
    if (data.error) throw new Error(data.error);
    const events = data.events;
    if (!events || !Array.isArray(events) || events.length === 0) {
      throw new Error('YM2151 log に events がありません');
    }

    // YM2151 log → audio samples via WASM
    const OPM_CLOCK = 3579545;
    const CLOCK_STEP = 64;
    const OPM_SAMPLE_RATE = OPM_CLOCK / CLOCK_STEP; // ~55930 Hz

    // Use a loop instead of Math.max(...spread) to avoid argument-count limits.
    let maxTime = -Infinity;
    for (const evt of events) {
      const t = parseFloat(evt.time);
      if (t > maxTime) maxTime = t;
    }
    const durationSec = maxTime + 0.5; // extra tail
    const numFrames = Math.floor(durationSec * OPM_SAMPLE_RATE);

    // Struct layout (must match C): float time (4 bytes) + uint8 addr (1) + uint8 data (1) + padding (2) = 8
    const STRUCT_SIZE = 8;
    const dataPtr = malloc(events.length * STRUCT_SIZE);
    // Recreate typed array views in case memory was reallocated (defensive practice).
    const HEAPU8 = new Uint8Array(ym2151Memory.buffer);
    const view = new DataView(ym2151Memory.buffer);
    events.forEach((evt, i) => {
      const baseAddr = dataPtr + i * STRUCT_SIZE;
      view.setFloat32(baseAddr, parseFloat(evt.time), true); // little-endian float32
      HEAPU8[baseAddr + 4] = parseInt(evt.addr); // 0x-prefixed hex → auto-detects base-16
      HEAPU8[baseAddr + 5] = parseInt(evt.data);
    });

    const actualFrames = generate_sound(dataPtr, events.length, numFrames);
    free(dataPtr);
    if (actualFrames <= 0) throw new Error('YM2151 audio generation に失敗しました');

    // Copy stereo interleaved float32 samples from WASM memory.
    const bufPtr = get_buffer_ptr();
    const HEAPF32 = new Float32Array(ym2151Memory.buffer);
    const floatOffset = bufPtr >> 2; // byte address → Float32Array index
    const interleaved = HEAPF32.subarray(floatOffset, floatOffset + actualFrames * 2);
    const left = new Float32Array(actualFrames);
    const right = new Float32Array(actualFrames);
    for (let i = 0; i < actualFrames; i++) {
      left[i] = interleaved[i * 2];
      right[i] = interleaved[i * 2 + 1];
    }
    free_buffer();

    const audioCtx = getAudioContext();
    audioBuffer = audioCtx.createBuffer(2, actualFrames, OPM_SAMPLE_RATE);
    audioBuffer.getChannelData(0).set(left);
    audioBuffer.getChannelData(1).set(right);
    audioCache.set(cacheKey, audioBuffer);
  }
  return audioBuffer;
}

// ---- MML → AudioBuffer を返す（WAV export 等で利用） ----
// 注意: 呼び出しのたびに新しいランダム音色を生成する（仮仕様）。
// WAV exportを複数回実行すると毎回異なる音色のWAVが生成される。
export async function renderYm2151AudioBuffer(mml: string): Promise<AudioBuffer> {
  const { attachment, toneString } = generateRandomToneAttachment();
  return generateYm2151AudioBuffer(mml, attachment, toneString);
}

export async function playWithYm2151(mml: string, onPlayStart?: () => void): Promise<void> {
  // Play audio via Web Audio API (available in content script isolated world).
  const audioCtx = getAudioContext();
  if (audioCtx.state === 'suspended') {
    // resume() can fail if no user gesture has occurred yet; AudioContext
    // will auto-resume when start() is called after a user gesture.
    audioCtx.resume().catch(() => {});
  }

  // 再生のたびに新しいランダム音色を生成する（仮仕様: issue #142）。
  // 同じMMLでも毎回異なる音色が使われるため、キャッシュはMML+音色文字列をkeyとする。
  const { attachment, toneString } = generateRandomToneAttachment();
  const audioBuffer = await generateYm2151AudioBuffer(mml, attachment, toneString);

  // 再生中の音声を停止してから新しい再生を開始する
  // onendedはそのまま残す（stop()でonendedが発火し、待機中のpromiseが解決される）
  // currentSourceのnull化はonendedハンドラーに委ねる
  if (currentSource) {
    try { currentSource.stop(); } catch { /* already stopped */ }
  }

  const source = audioCtx.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(audioCtx.destination);
  currentSource = source;

  await new Promise<void>(resolve => {
    source.onended = () => {
      source.disconnect();
      if (currentSource === source) currentSource = null;
      resolve();
    };
    source.start();
    try { onPlayStart?.(); } catch { /* UI callback must not break playback */ }
  });
}
