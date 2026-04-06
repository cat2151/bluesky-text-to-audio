/**
 * MML to AST converter using Tree-sitter
 *
 * This module uses web-tree-sitter for parsing in the browser and Node.js.
 * It follows the Tree-sitter approach where grammar.js is the Single Source of Truth (SSOT).
 */
import * as TreeSitter from './web-tree-sitter.js';
import { cst_to_ast_wasm } from '../pkg/tonejs_mml_to_json.js';
let parser = null;
let parserInitialized = false;
/**
 * Initialize the Tree-sitter parser
 * This must be called before using mml2ast
 * @param wasmPath - Optional custom path to the WASM file (for Node.js/testing)
 */
export async function initParser(wasmPath) {
    if (parserInitialized) {
        return;
    }
    await TreeSitter.Parser.init();
    parser = new TreeSitter.Parser();
    // Load the MML language from the generated WASM file
    // Use custom path if provided (for Node.js/testing), otherwise use default path
    // For browser, construct path relative to this module's location to support subdirectory deployments
    let wasmFile = wasmPath;
    if (!wasmFile) {
        if (typeof window !== 'undefined' && import.meta?.url) {
            // Browser with ES modules: resolve relative to this module
            wasmFile = new URL('./tree-sitter-mml/tree-sitter-mml.wasm', import.meta.url).href;
        }
        else {
            // Node.js or fallback: use relative path
            wasmFile = 'tree-sitter-mml/tree-sitter-mml.wasm';
        }
    }
    const Lang = await TreeSitter.Language.load(wasmFile);
    parser.setLanguage(Lang);
    parserInitialized = true;
}
/**
 * Convert Tree-sitter node to CST JSON format
 */
function nodeToCSTJson(node) {
    const result = {
        type: node.type,
        text: node.text,
        children: [],
        fields: {}
    };
    // Process named children
    for (let i = 0; i < node.namedChildCount; i++) {
        const child = node.namedChild(i);
        if (child) {
            const fieldName = node.fieldNameForChild(i);
            const childJson = nodeToCSTJson(child);
            if (fieldName) {
                if (!result.fields[fieldName]) {
                    result.fields[fieldName] = [];
                }
                result.fields[fieldName].push(childJson);
            }
            else {
                result.children.push(childJson);
            }
        }
    }
    return result;
}
/**
 * Converts MML string into an Abstract Syntax Tree using Tree-sitter
 *
 * Note: Parser must be initialized before calling this function via initParser()
 *
 * @param mml - MML (Music Macro Language) string to parse
 * @returns Array of AST tokens
 */
export function mml2ast(mml) {
    if (!parser || !parserInitialized) {
        throw new Error('Parser not initialized. Call initParser() first.');
    }
    const tree = parser.parse(mml);
    if (!tree) {
        throw new Error('Failed to parse MML');
    }
    const root = tree.rootNode;
    // Convert Tree-sitter CST to JSON format
    const cstJson = nodeToCSTJson(root);
    // Use Rust WASM function to convert CST to AST
    const astJson = cst_to_ast_wasm(JSON.stringify(cstJson));
    const result = JSON.parse(astJson);
    // Check for error response
    if (result.error) {
        throw new Error(`MML parsing error: ${result.error}`);
    }
    return result;
}
//# sourceMappingURL=mml2ast.js.map