// chord2mml をローカルESMモジュールとして直接インポート（mml2abc.mjsと同じ方法）
// CDNからの動的ロードはbsky.appのCSP（script-src）により遮断されるため、
// このアプローチを採用する。
import { chord2mml } from '../chord2mml.mjs';

export async function parseChordViaLibrary(chord: string): Promise<string> {
  return chord2mml.parse(chord);
}
