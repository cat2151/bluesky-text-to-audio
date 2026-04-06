// Minimal TypeScript declarations for web-tree-sitter (for use in the extension content scripts).
// The actual implementation is in web-tree-sitter.js (vendored ES module).
// Only the subset of the API used by ym2151.ts is declared here.

export interface SyntaxNode {
  type: string;
  startIndex: number;
  endIndex: number;
  childCount: number;
  child(index: number): SyntaxNode | null;
}

export interface Tree {
  rootNode: SyntaxNode;
}

export declare class Language {
  static load(url: string | URL): Promise<Language>;
}

export declare class Parser {
  static init(options?: { locateFile?: (name: string, prefix: string) => string }): Promise<void>;
  parse(text: string): Tree;
  setLanguage(language: Language): void;
}
