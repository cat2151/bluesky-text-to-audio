import { parseChordViaLibrary } from './loaders/chord2mml';
import { parseTracks, type ChordTargetEngine } from './mixParser';

// ---- コード進行テキストをMMLに変換（方言を正規化しつつパース、成功したMMLを直接返す） ----
export async function chordToMml(chord: string): Promise<string> {
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
  let lastError: unknown;
  for (const seq of getAllCombinations(transforms)) {
    let candidate = chord;
    for (const fn of seq) candidate = fn(candidate);
    if (tried.has(candidate)) continue;
    tried.add(candidate);
    try {
      return await parseChordViaLibrary(candidate);
    } catch (e) { lastError = e; }
  }
  // すべての候補が失敗した場合は最後のエラーを投げる
  throw lastError;
}

// ---- CHORDターゲットエンジン → テキストプレフィックスのマッピング ----
function engineToPrefix(engine: ChordTargetEngine): string {
  switch (engine) {
    case 'YM2151': return 'YM2151';
    case 'TONE_JS': return 'Tone.js';
    case 'SURGE_XT': return 'Surge XT';
    case 'MMLABC': return 'mmlabc';
  }
}

// ---- トラックをテキスト表現に戻す ----
function trackToText(track: import('./mixParser').Track): string {
  switch (track.type) {
    case 'VOICEVOX': return `VOICEVOX ${track.text}`;
    case 'YM2151': return `YM2151 ${track.text}`;
    case 'TONE_JS': return `Tone.js ${track.text}`;
    case 'SURGE_XT': return `Surge XT ${track.text}`;
    case 'MMLABC': return `mmlabc ${track.text}`;
    case 'CHORD':
      if (track.targetEngine !== undefined) {
        return `chord ${engineToPrefix(track.targetEngine)} ${track.text}`;
      }
      return `chord ${track.text}`;
    case 'EFFECT': return `effect ${track.text}`;
  }
}

// ---- mixテキストのchord+engineトラックをエンジン+MMLテキストに展開する ----
// chord+engineトラックがある場合のみ変換し、textareaへの表示用テキストを返す。
// 変換がなかった場合は changed=false を返す。
export async function chordPreprocessMixText(text: string): Promise<{ preprocessed: string; changed: boolean }> {
  const tracks = parseTracks(text);
  const hasChordWithEngine = tracks.some(t => t.type === 'CHORD' && t.targetEngine !== undefined);
  if (!hasChordWithEngine) return { preprocessed: text, changed: false };

  const processedParts = await Promise.all(
    tracks.map(async (track) => {
      if (track.type === 'CHORD' && track.targetEngine !== undefined) {
        const mml = await chordToMml(track.text);
        return `${engineToPrefix(track.targetEngine)} ${mml}`;
      }
      return trackToText(track);
    }),
  );

  return { preprocessed: processedParts.join(';\n'), changed: true };
}
