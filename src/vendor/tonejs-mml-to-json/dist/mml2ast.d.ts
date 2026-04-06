/**
 * MML to AST converter using Tree-sitter
 *
 * This module uses web-tree-sitter for parsing in the browser and Node.js.
 * It follows the Tree-sitter approach where grammar.js is the Single Source of Truth (SSOT).
 */
export interface NoteToken {
    type: 'note';
    note: string;
    accidental: string;
    duration: number | null;
    dots: number;
    length: number;
}
export interface RestToken {
    type: 'rest';
    duration: number | null;
    dots: number;
    length: number;
}
export interface LengthToken {
    type: 'length';
    value: number | null;
    length: number;
}
export interface OctaveToken {
    type: 'octave';
    value: number | null;
    length: number;
}
export interface OctaveUpToken {
    type: 'octaveUp';
    length: number;
}
export interface OctaveDownToken {
    type: 'octaveDown';
    length: number;
}
export interface InstrumentToken {
    type: 'instrument';
    value: string | null;
    args?: string;
    length: number;
}
export interface TempoToken {
    type: 'tempo';
    value: number | null;
    length: number;
}
export interface KeyTransposeToken {
    type: 'keyTranspose';
    value: number | null;
    length: number;
}
export interface ChordNote {
    note: string;
    accidental: string;
}
export interface ChordToken {
    type: 'chord';
    notes: ChordNote[];
    duration: number | null;
    dots: number;
    length: number;
}
export type ASTToken = NoteToken | ChordToken | RestToken | LengthToken | OctaveToken | OctaveUpToken | OctaveDownToken | InstrumentToken | TempoToken | KeyTransposeToken;
/**
 * Initialize the Tree-sitter parser
 * This must be called before using mml2ast
 * @param wasmPath - Optional custom path to the WASM file (for Node.js/testing)
 */
export declare function initParser(wasmPath?: string): Promise<void>;
/**
 * Converts MML string into an Abstract Syntax Tree using Tree-sitter
 *
 * Note: Parser must be initialized before calling this function via initParser()
 *
 * @param mml - MML (Music Macro Language) string to parse
 * @returns Array of AST tokens
 */
export declare function mml2ast(mml: string): ASTToken[];
//# sourceMappingURL=mml2ast.d.ts.map