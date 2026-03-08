/* tslint:disable */
/* eslint-disable */

/**
 * WASM binding for ast2json - converts AST JSON to Tone.js JSON
 */
export function ast2json_wasm(ast_json: string): string;

/**
 * WASM binding for cst_to_ast - converts CST JSON to AST JSON
 * This allows web-tree-sitter CST to be converted to our internal AST format.
 */
export function cst_to_ast_wasm(cst_json: string): string;

/**
 * WASM binding for CST-based parsing (web-tree-sitter integration)
 * This is the primary WASM entry point when tree-sitter feature is not enabled.
 * Accepts a JSON-serialized CST from web-tree-sitter and converts it to Tone.js JSON.
 */
export function cst_to_json_wasm(cst_json: string): string;

/**
 * WASM binding for mml2ast (stub for non-tree-sitter builds)
 * For WASM builds, use web-tree-sitter in JavaScript and cst_to_json_wasm
 */
export function mml2ast_wasm(_mml: string): string;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly ast2json_wasm: (a: number, b: number) => [number, number];
    readonly cst_to_ast_wasm: (a: number, b: number) => [number, number];
    readonly cst_to_json_wasm: (a: number, b: number) => [number, number];
    readonly mml2ast_wasm: (a: number, b: number) => [number, number];
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
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
