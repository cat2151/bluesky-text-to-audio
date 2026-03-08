/* tslint:disable */
/* eslint-disable */

/**
 * Convert SMF binary data to YM2151 register log JSON (WASM entry point)
 *
 * This function is exposed to JavaScript for browser usage.
 *
 * # Arguments
 * * `smf_data` - Standard MIDI File binary data as bytes
 *
 * # Returns
 * YM2151 register log as a JSON string on success, or a JSON string containing an
 * `error` field (e.g. `{"error": "<message>"}`) on failure.
 *
 * # Example (JavaScript)
 * ```javascript
 * import init, { smf_to_ym2151_json } from './pkg/smf_to_ym2151log.js';
 *
 * await init();
 * const midiBytes = new Uint8Array([...]); // Your MIDI file bytes
 * const jsonResult = smf_to_ym2151_json(midiBytes);
 * console.log(jsonResult);
 * ```
 */
export function smf_to_ym2151_json(smf_data: Uint8Array): string;

/**
 * Convert SMF binary data to YM2151 register log JSON with optional attachment JSON
 *
 * The second argument accepts an attachment JSON payload that can enable features such as
 * delayed vibrato or custom tone definitions. Pass an empty array when no attachment is available.
 */
export function smf_to_ym2151_json_with_attachment(smf_data: Uint8Array, attachment_json: Uint8Array): string;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly smf_to_ym2151_json: (a: number, b: number) => [number, number];
    readonly smf_to_ym2151_json_with_attachment: (a: number, b: number, c: number, d: number) => [number, number];
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
