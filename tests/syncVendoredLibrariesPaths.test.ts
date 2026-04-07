import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const currentFilePath = fileURLToPath(import.meta.url);
const currentDir = dirname(currentFilePath);
const repoRoot = join(currentDir, "..");

describe("Sync Vendored Libraries paths", () => {
  it("workflow uses the current vendored file locations", () => {
    const workflow = readFileSync(join(repoRoot, ".github/workflows/check-vendor-updates.yml"), "utf8");

    expect(workflow).toContain("src/vendor/chord2mml.mjs 12");
    expect(workflow).toContain("src/vendor/mml2abc.mjs 9");
    expect(workflow).toContain("src/vendor/tonejs-json-sequencer.mjs");

    expect(workflow).not.toContain("src/chord2mml.mjs 12");
    expect(workflow).not.toContain("src/mml2abc.mjs 9");
    expect(workflow).not.toContain("src/tonejs-json-sequencer.mjs");
  });

  it("ym2151 sync script targets the vendored directories that exist in the repo", () => {
    const scriptPath = join(repoRoot, ".github/scripts/sync_vendor_ym2151.py");
    const script = readFileSync(scriptPath, "utf8");
    const expectedPaths = [
      "src/vendor/web-ym2151/ym2151.js",
      "src/vendor/web-ym2151/ym2151.wasm",
      "src/vendor/smf-to-ym2151log-rust/pkg/smf_to_ym2151log.js",
      "src/vendor/smf-to-ym2151log-rust/pkg/smf_to_ym2151log_bg.wasm",
      "src/vendor/smf-to-ym2151log-rust/pkg/smf_to_ym2151log.d.ts",
      "src/vendor/mmlabc-to-smf-wasm/pkg/mmlabc_to_smf_wasm.js",
      "src/vendor/mmlabc-to-smf-wasm/pkg/mmlabc_to_smf_wasm_bg.wasm",
      "src/vendor/mmlabc-to-smf-wasm/pkg/mmlabc_to_smf_wasm.d.ts",
      "src/vendor/mmlabc-tree-sitter-mml/tree-sitter-mml.wasm",
    ];

    for (const relativePath of expectedPaths) {
      expect(script).toContain(relativePath);
      expect(existsSync(join(repoRoot, relativePath))).toBe(true);
    }
  });
});
