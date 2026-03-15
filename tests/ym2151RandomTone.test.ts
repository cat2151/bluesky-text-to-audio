import { describe, it, expect, afterEach } from 'vitest';
import {
  generateRandomToneAttachment,
  applyRandomToneAttachmentToMml,
} from '../src/ym2151RandomTone';

describe('ym2151RandomTone', () => {
  describe('generateRandomToneAttachment', () => {
    it('attachmentとtoneStringを返す', async () => {
      const result = await generateRandomToneAttachment();
      expect(result).toHaveProperty('attachment');
      expect(result).toHaveProperty('toneString');
    });

    it('attachmentは1エントリの配列', async () => {
      const { attachment } = await generateRandomToneAttachment();
      expect(Array.isArray(attachment)).toBe(true);
      expect(attachment.length).toBe(1);
    });

    it('attachmentエントリにProgramChange=0とToneがある', async () => {
      const { attachment } = await generateRandomToneAttachment();
      const entry = attachment[0];
      expect(entry.ProgramChange).toBe(0);
      expect(entry.Tone).toBeDefined();
      expect(Array.isArray(entry.Tone.events)).toBe(true);
    });

    it('Tone.eventsにYM2151レジスタイベントが含まれる', async () => {
      const { attachment } = await generateRandomToneAttachment();
      const events = attachment[0].Tone.events;
      expect(events.length).toBeGreaterThan(0);
      // 全イベントがtime/addr/dataフィールドを持つ
      for (const evt of events) {
        expect(typeof evt.time).toBe('number');
        expect(typeof evt.addr).toBe('string');
        expect(typeof evt.data).toBe('string');
        expect(evt.addr).toMatch(/^0x[0-9A-F]+$/i);
        expect(evt.data).toMatch(/^0x[0-9A-F]+$/i);
      }
    });

    it('RL/FL/CONレジスタ(0x20)が含まれる', async () => {
      const { attachment } = await generateRandomToneAttachment();
      const events = attachment[0].Tone.events;
      const rlFlConEvent = events.find(e => e.addr === '0x20');
      expect(rlFlConEvent).toBeDefined();
      // RL=11（ステレオ）を確認: 0xC0ビットが立っている
      const dataVal = parseInt(rlFlConEvent!.data, 16);
      expect(dataVal & 0xC0).toBe(0xC0);
    });

    it('toneStringはWASMが返すレジスタペア16進文字列である', async () => {
      const { toneString } = await generateRandomToneAttachment();
      expect(typeof toneString).toBe('string');
      expect(toneString.length).toBeGreaterThan(0);
      // 4文字単位の16進ペア（アドレス2桁+データ2桁）
      expect(toneString.length % 4).toBe(0);
      expect(toneString).toMatch(/^[0-9A-Fa-f]+$/);
    });
  });

  describe('applyRandomToneAttachmentToMml', () => {
    afterEach(() => {
      // no Math.random mocks needed (WASM uses its own seeded RNG)
    });

    it('MMLの先頭にアタッチメントJSONが付加される', async () => {
      const result = await applyRandomToneAttachmentToMml('o4 l8 cde');
      const newlineIdx = result.indexOf('\n');
      expect(newlineIdx).toBeGreaterThan(0);
      const firstLine = result.slice(0, newlineIdx);
      const rest = result.slice(newlineIdx + 1);
      expect(firstLine.startsWith('[')).toBe(true);
      expect(rest).toBe('@0 o4 l8 cde');
    });

    it('先頭行はパース可能なJSONである', async () => {
      const result = await applyRandomToneAttachmentToMml('o4 cde');
      const firstLine = result.slice(0, result.indexOf('\n'));
      const parsed = JSON.parse(firstLine) as unknown[];
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBe(1);
    });

    it('アタッチメントJSONはToneAttachmentEntry形式を持つ', async () => {
      const result = await applyRandomToneAttachmentToMml('o4 cde');
      const firstLine = result.slice(0, result.indexOf('\n'));
      const parsed = JSON.parse(firstLine) as Array<{ ProgramChange: number; Tone: { events: unknown[] } }>;
      expect(parsed[0].ProgramChange).toBe(0);
      expect(Array.isArray(parsed[0].Tone.events)).toBe(true);
      expect(parsed[0].Tone.events.length).toBeGreaterThan(0);
    });

    it('空MMLのとき先頭にJSON行＋改行が付く', async () => {
      const result = await applyRandomToneAttachmentToMml('');
      expect(result.startsWith('[')).toBe(true);
      // 常に JSON+'\n' を返すことで extractAttachmentFromMml と整合する
      const newlineIdx = result.indexOf('\n');
      expect(newlineIdx).toBeGreaterThan(0);
      const afterNewline = result.slice(newlineIdx + 1);
      expect(afterNewline).toBe('');
    });

    it('@NのないMMLには@0が自動付与される', async () => {
      const result = await applyRandomToneAttachmentToMml('c');
      const mmlBody = result.slice(result.indexOf('\n') + 1);
      expect(mmlBody).toBe('@0 c');
    });

    it('既に@0があるMMLには@0が重複付与されない', async () => {
      const result = await applyRandomToneAttachmentToMml('@0 c');
      const mmlBody = result.slice(result.indexOf('\n') + 1);
      expect(mmlBody).toBe('@0 c');
    });

    it('既に@2などProgramChangeがあるMMLには@0が付与されない', async () => {
      const result = await applyRandomToneAttachmentToMml('@2 c');
      const mmlBody = result.slice(result.indexOf('\n') + 1);
      expect(mmlBody).toBe('@2 c');
    });

    it('途中に@Nが含まれるMMLには@0が付与されない', async () => {
      const result = await applyRandomToneAttachmentToMml('t150 v11 @2 c');
      const mmlBody = result.slice(result.indexOf('\n') + 1);
      expect(mmlBody).toBe('t150 v11 @2 c');
    });

    it('既にアタッチメントJSONがある場合は二重付与されない', async () => {
      const first = await applyRandomToneAttachmentToMml('o4 cde');
      const second = await applyRandomToneAttachmentToMml(first);
      const lines = second.split('\n');
      // 先頭行はJSON、2行目はMML（@0付き）
      expect(lines[0].startsWith('[')).toBe(true);
      expect(lines[1]).toBe('@0 o4 cde');
      // 先頭行JSONが有効なアタッチメントであることを確認（置換されている）
      const parsed = JSON.parse(lines[0]) as Array<{ ProgramChange: number; Tone: { events: unknown[] } }>;
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed[0].ProgramChange).toBe(0);
      expect(Array.isArray(parsed[0].Tone.events)).toBe(true);
      // 3行目以降にJSONが混入しないこと（二重付与なし）
      for (let i = 1; i < lines.length; i++) {
        expect(lines[i].startsWith('[')).toBe(false);
      }
    });
  });
});
