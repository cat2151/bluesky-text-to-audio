import type { Chord2mmlLib } from './types';

// ---- コード進行テキストをMMLに変換（方言を正規化しつつパース、成功したMMLを直接返す） ----
export function chordToMml(chord: string, chord2mml: Chord2mmlLib): string {
  function replaceHyphenToDot(s: string): string {
    return s.replace(/-/g, '・');
  }
  function replaceMinorRomanNumerals(s: string): string {
    return s
      .replace(/\bvii(?![a-zA-Z])/g, 'VIIm')
      .replace(/\biii(?![a-zA-Z])/g, 'IIIm')
      .replace(/\bvi(?![a-zA-Z])/g, 'VIm')
      .replace(/\biv(?![a-zA-Z])/g, 'IVm')
      .replace(/\bii(?![a-zA-Z])/g, 'IIm')
      .replace(/\bv(?![a-zA-Z])/g, 'Vm')
      .replace(/\bi(?![a-zA-Z])/g, 'Im');
  }
  function permute(arr: Array<(s: string) => string>): Array<Array<(s: string) => string>> {
    if (arr.length <= 1) return [arr];
    const result: Array<Array<(s: string) => string>> = [];
    for (let i = 0; i < arr.length; i++) {
      const rest = arr.slice(0, i).concat(arr.slice(i + 1));
      for (const p of permute(rest)) result.push([arr[i], ...p]);
    }
    return result;
  }
  function getAllCombinations(funcs: Array<(s: string) => string>): Array<Array<(s: string) => string>> {
    const results: Array<Array<(s: string) => string>> = [];
    const n = funcs.length;
    for (let i = 0; i < (1 << n); i++) {
      const seq: Array<(s: string) => string> = [];
      for (let j = 0; j < n; j++) {
        if (i & (1 << j)) seq.push(funcs[j]);
      }
      results.push(...(seq.length === 0 ? [[(x: string) => x]] : permute(seq)));
    }
    return results;
  }

  const transforms: Array<(s: string) => string> = [replaceHyphenToDot, replaceMinorRomanNumerals];
  const tried = new Set<string>();
  for (const seq of getAllCombinations(transforms)) {
    let candidate = chord;
    for (const fn of seq) candidate = fn(candidate);
    if (tried.has(candidate)) continue;
    tried.add(candidate);
    try {
      return chord2mml.parse(candidate);
    } catch (_e) {}
  }
  return chord2mml.parse(chord);
}
