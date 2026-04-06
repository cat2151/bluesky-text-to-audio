// ym2151RandomTone.ts
// Random YM2151 tone generation using vendored WASM from cat2151/ym2151-tone-editor.
//
// Upstream: https://github.com/cat2151/ym2151-tone-editor
// Upstream-PR: https://github.com/cat2151/ym2151-tone-editor/pull/214
//
// Rust is the SSoT for all YM2151 logic. Do NOT port Rust logic to JS/TS.
// Chrome extension CSP prevents loading WASM from external URLs, so the WASM
// binary is vendored locally in src/vendor/ym2151-tone-editor/pkg/.

import ym2151ToneEditorInit, { generate_random_tone_registers } from '../vendor/ym2151-tone-editor/pkg/ym2151_wasm.js';

// ---- WASM initialization (lazy singleton) ----

let wasmInitPromise: Promise<void> | null = null;

async function ensureWasmInit(): Promise<void> {
  if (!wasmInitPromise) {
    wasmInitPromise = ym2151ToneEditorInit().then(() => undefined);
  }
  return wasmInitPromise;
}

// ---- Types ----

interface ToneEvent {
  time: number;
  addr: string;
  data: string;
}

export interface ToneAttachmentEntry {
  ProgramChange: number;
  Tone: { events: ToneEvent[] };
}

// ---- Helpers ----

/**
 * Convert the hex register pairs string from WASM to ToneEvent[].
 * The WASM returns a hex string of 4-char pairs: 2 chars addr + 2 chars data.
 * Example: "20C7400B..." → [{addr:"0x20", data:"0xC7"}, {addr:"0x40", data:"0x0B"}, ...]
 */
function hexRegisterPairsToToneEvents(hexStr: string): ToneEvent[] {
  const events: ToneEvent[] = [];
  for (let i = 0; i + 3 < hexStr.length; i += 4) {
    const addr = parseInt(hexStr.slice(i, i + 2), 16);
    const data = parseInt(hexStr.slice(i + 2, i + 4), 16);
    events.push({
      time: 0.0,
      addr: '0x' + addr.toString(16).toUpperCase().padStart(2, '0'),
      data: '0x' + data.toString(16).toUpperCase().padStart(2, '0'),
    });
  }
  return events;
}

/**
 * Generate a random YM2151 tone using WASM and return it as an attachment object
 * (compatible with the PIANO_PRESET_ATTACHMENT_OBJ format used by
 * smf_to_ym2151_json_with_attachment).
 *
 * @returns Object containing the attachment array and the raw WASM hex string (toneString).
 */
export async function generateRandomToneAttachment(): Promise<{ attachment: ToneAttachmentEntry[]; toneString: string }> {
  await ensureWasmInit();
  // Pass Date.now() as seed for a different tone on each call.
  // current_note=69 embeds A4 (concert pitch) in the tone register data.
  const toneString = generate_random_tone_registers(Date.now(), 69);
  const events = hexRegisterPairsToToneEvents(toneString);
  const attachment: ToneAttachmentEntry[] = [
    {
      ProgramChange: 0,
      Tone: { events },
    },
  ];
  return { attachment, toneString };
}

/**
 * ランダムYM2151音色アタッチメントJSONをMMLの先頭行に付加して新しいMMLを生成する。
 * 後続処理でアタッチメントJSONを先頭行から抽出してsmf_to_ym2151_json_with_attachmentに渡す。
 * Tone.jsモードの applyRandomToneToMmlIfNeeded に相当するYM2151向け処理。
 * 既にアタッチメントJSONが先頭行にある場合は置換（二重付与を防止）する。
 * 空MMLのときは常に「JSON+改行」を返すことで extractAttachmentFromMml と整合させる。
 */
export async function applyRandomToneAttachmentToMml(mml: string): Promise<string> {
  const { attachment } = await generateRandomToneAttachment();
  const attachmentJson = JSON.stringify(attachment);
  // 既存の先頭行アタッチメントJSONを剥がしてから付与（二重付与防止）
  let mmlBody = stripAttachmentPrefix(mml);
  // MML本体に@N(ProgramChange)がない場合、添付JSONのProgramChangeに対応する@Nを先頭に自動付与
  // こうしないと添付JSONの音色が反映されない（添付JSONはProgramChangeを指定しており、MMLで@Nを指定しないと効果がない）
  const trimmedBody = mmlBody.trim();
  if (trimmedBody.length > 0 && attachment[0]?.ProgramChange === 0 && !/@\d+/.test(trimmedBody)) {
    mmlBody = `@0 ${trimmedBody}`;
  }
  return `${attachmentJson}\n${mmlBody}`;
}

/**
 * MMLの先頭行にアタッチメントJSONが含まれている場合はそれを除去してMML本体のみを返す。
 * applyRandomToneAttachmentToMml が二重付与しないために使用。
 */
function stripAttachmentPrefix(mml: string): string {
  const newlineIdx = mml.indexOf('\n');
  if (newlineIdx !== -1) {
    const firstLine = mml.slice(0, newlineIdx).trim();
    if (firstLine.startsWith('[')) {
      try {
        JSON.parse(firstLine);
        return mml.slice(newlineIdx + 1);
      } catch { /* not JSON, treat as MML */ }
    }
  }
  return mml;
}
