/**
 * AST to JSON converter using Rust WASM
 *
 * This module uses the Rust WASM implementation, consolidating the duplicate
 * TypeScript implementation (issue #26).
 *
 * The previous pure TypeScript implementation has been removed as part of the
 * consolidation. It can be found in git history (commit d5723ea and earlier).
 */
import { ast2json_wasm } from '../pkg/tonejs_mml_to_json.js';
/**
 * Converts AST to Tone.js compatible JSON format using Rust WASM
 *
 * Note: WASM must be initialized before calling this function.
 * In tests, this is handled by test/setup.js
 * In browser, WASM initialization should be done before calling this function
 * (e.g., by importing and awaiting the init function from pkg/tonejs_mml_to_json.js)
 *
 * @param ast - Array of AST tokens to convert
 * @returns Array of Tone.js commands
 */
export function ast2json(ast) {
    const astJson = JSON.stringify(ast);
    const resultJson = ast2json_wasm(astJson);
    const result = JSON.parse(resultJson);
    // Check for error response
    if (result.error) {
        throw new Error(`AST to JSON conversion error: ${result.error}`);
    }
    return result;
}
//# sourceMappingURL=ast2json.js.map