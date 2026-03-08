/* tslint:disable */
/* eslint-disable */

/**
 * Convert MML parse tree JSON to SMF binary (WASM entry point)
 *
 * This is the main WASM function that takes a parse tree JSON from
 * web-tree-sitter and returns Standard MIDI File binary data.
 *
 * The function now supports multi-channel MML with semicolons through the
 * tree-sitter grammar. The parse tree can contain either:
 * - Direct items (for single-channel MML like "cde")
 * - A channel_groups node (for multi-channel MML like "c;e;g")
 *
 * # Arguments
 * * `parse_tree_json` - JSON string representing the parse tree from web-tree-sitter
 * * `mml_source` - Original MML source text (reserved for diagnostics or future features)
 *
 * # Returns
 * SMF binary data as Uint8Array
 */
export function parse_tree_json_to_smf(parse_tree_json: string, _mml_source: string): Uint8Array;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly parse_tree_json_to_smf: (a: number, b: number, c: number, d: number) => [number, number, number, number];
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
    readonly __externref_table_dealloc: (a: number) => void;
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
