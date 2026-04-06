/**
 * tonejs-mml-to-json - MML to Tone.js JSON Sequencer Format Converter
 *
 * This is the main entry point for the library.
 * It exports the core functionality for converting MML to JSON format
 * compatible with tonejs-json-sequencer.
 *
 * This implementation uses Tree-sitter for parsing, with grammar.js as the
 * Single Source of Truth (SSOT) for the MML syntax.
 */
import type { ASTToken } from './mml2ast.js';
import type { ToneCommand } from './ast2json.js';
export type { ASTToken, NoteToken, RestToken, LengthToken, OctaveToken, OctaveUpToken, OctaveDownToken, InstrumentToken } from './mml2ast.js';
export type { ToneCommand, CreateNodeCommand, ConnectCommand, TriggerAttackReleaseCommand, DepthRampToCommand } from './ast2json.js';
/**
 * Initialize the WASM module and Tree-sitter parser.
 * This must be called before using any conversion functions.
 *
 * @returns Promise that resolves when WASM is initialized
 */
export declare function initWasm(): Promise<void>;
/**
 * Convert MML string directly to Tone.js JSON format.
 * This is the main convenience function that combines mml2ast and ast2json.
 *
 * @param mml - MML (Music Macro Language) string to convert
 * @returns Tone.js compatible JSON commands
 * @throws Error if WASM is not initialized or if conversion fails
 */
export declare function mml2json(mml: string): ToneCommand[];
/**
 * Convert MML string to Abstract Syntax Tree (AST).
 *
 * @param mml - MML (Music Macro Language) string to parse
 * @returns Array of AST tokens
 * @throws Error if WASM is not initialized or if parsing fails
 */
export declare function mml2ast(mml: string): ASTToken[];
/**
 * Convert Abstract Syntax Tree (AST) to Tone.js JSON format.
 *
 * @param ast - Array of AST tokens
 * @returns Tone.js compatible JSON commands
 * @throws Error if WASM is not initialized or if conversion fails
 */
export declare function ast2json(ast: ASTToken[]): ToneCommand[];
declare const _default: {
    initWasm: typeof initWasm;
    mml2json: typeof mml2json;
    mml2ast: typeof mml2ast;
    ast2json: typeof ast2json;
};
export default _default;
//# sourceMappingURL=index.d.ts.map