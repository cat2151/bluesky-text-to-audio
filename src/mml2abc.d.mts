export declare class SyntaxError extends Error {
  expected: unknown;
  found: string | null;
  location: unknown;
  name: string;
}
export declare function parse(input: string): string;
