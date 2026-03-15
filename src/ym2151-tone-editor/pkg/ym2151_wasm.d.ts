/* tslint:disable */
/* eslint-disable */
/**
 * Generate a random YM2151 tone and return it as a register hex string.
 *
 * # Parameters
 * - `seed`: A numeric seed for the random number generator.  Pass `Date.now()`
 *   from TypeScript to get a different tone on each call.
 * - `current_note`: MIDI note number (0–127) to embed in the tone data.
 *   Pass 69 for A4 (concert pitch) if unsure.
 *
 * # Returns
 * A hex string of register address/data pairs (4 chars each, e.g. `"4000..."`).
 * This is the same format used by `editor_rows_to_registers` in the native app.
 */
export function generate_random_tone_registers(seed: number, current_note: number): string;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly generate_random_tone_registers: (a: number, b: number) => [number, number];
  readonly __wbindgen_externrefs: WebAssembly.Table;
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
