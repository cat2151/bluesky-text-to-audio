import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  getDefaultConfig,
  generateRandomToneString,
  generateRandomToneAttachment,
  applyRandomToneAttachmentToMml,
} from '../src/ym2151RandomTone';

describe('ym2151RandomTone', () => {
  describe('generateRandomToneString', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('デフォルト設定でトーン文字列を生成する', () => {
      const config = getDefaultConfig();
      const toneString = generateRandomToneString(config);
      expect(typeof toneString).toBe('string');
      expect(toneString.length).toBeGreaterThan(0);
    });

    it('5行のトーン文字列を生成する（4オペレーター + グローバルパラメーター）', () => {
      const config = getDefaultConfig();
      const toneString = generateRandomToneString(config);
      const lines = toneString.trim().split('\n');
      expect(lines.length).toBe(5);
    });

    it('グローバル行にCON=とFL=が含まれる', () => {
      const config = getDefaultConfig();
      const toneString = generateRandomToneString(config);
      const lines = toneString.trim().split('\n');
      const globalLine = lines[4];
      expect(globalLine).toMatch(/CON=[0-9A-F]/i);
      expect(globalLine).toMatch(/FL=[0-9A-F]/i);
    });

    it('オペレーター行にTL=が含まれる', () => {
      const config = getDefaultConfig();
      const toneString = generateRandomToneString(config);
      const lines = toneString.trim().split('\n');
      // 最初の4行はオペレーターパラメーター
      for (let i = 0; i < 4; i++) {
        expect(lines[i]).toMatch(/TL=[0-9A-F]+/i);
      }
    });

    it('同一の乱数列であれば同一のトーン文字列を生成する（決定的）', () => {
      const config = getDefaultConfig();

      // 同じ固定シーケンスで2回生成 → 同一結果になるはず
      const fixedValues = [0.1, 0.5, 0.9, 0.2, 0.7, 0.3, 0.8, 0.4, 0.6, 0.0,
                           0.1, 0.5, 0.9, 0.2, 0.7, 0.3, 0.8, 0.4, 0.6, 0.0];
      let callCount = 0;
      const spy = vi.spyOn(Math, 'random').mockImplementation(() => fixedValues[callCount++ % fixedValues.length]);
      const first = generateRandomToneString(config);
      callCount = 0; // シーケンスをリセット
      const second = generateRandomToneString(config);
      spy.mockRestore();

      expect(first).toBe(second);
    });

    it('異なる乱数列であれば異なるトーン文字列を生成する（決定的）', () => {
      const config = getDefaultConfig();

      const spy = vi.spyOn(Math, 'random').mockReturnValue(0.0);
      const allLow = generateRandomToneString(config);
      spy.mockReturnValue(1.0);
      const allHigh = generateRandomToneString(config);
      spy.mockRestore();

      expect(allLow).not.toBe(allHigh);
    });
  });

  describe('generateRandomToneAttachment', () => {
    it('attachmentとtoneStringを返す', () => {
      const result = generateRandomToneAttachment();
      expect(result).toHaveProperty('attachment');
      expect(result).toHaveProperty('toneString');
    });

    it('attachmentは1エントリの配列', () => {
      const { attachment } = generateRandomToneAttachment();
      expect(Array.isArray(attachment)).toBe(true);
      expect(attachment.length).toBe(1);
    });

    it('attachmentエントリにProgramChange=0とToneがある', () => {
      const { attachment } = generateRandomToneAttachment();
      const entry = attachment[0];
      expect(entry.ProgramChange).toBe(0);
      expect(entry.Tone).toBeDefined();
      expect(Array.isArray(entry.Tone.events)).toBe(true);
    });

    it('Tone.eventsにYM2151レジスタイベントが含まれる', () => {
      const { attachment } = generateRandomToneAttachment();
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

    it('RL/FL/CONレジスタ(0x20)が含まれる', () => {
      const { attachment } = generateRandomToneAttachment();
      const events = attachment[0].Tone.events;
      const rlFlConEvent = events.find(e => e.addr === '0x20');
      expect(rlFlConEvent).toBeDefined();
      // RL=11（ステレオ）を確認: 0xC0ビットが立っている
      const dataVal = parseInt(rlFlConEvent!.data, 16);
      expect(dataVal & 0xC0).toBe(0xC0);
    });

    it('toneStringがgenerateRandomToneStringと同じ形式', () => {
      const { toneString } = generateRandomToneAttachment();
      const lines = toneString.trim().split('\n');
      expect(lines.length).toBe(5);
    });
  });

  describe('applyRandomToneAttachmentToMml', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('MMLの先頭にアタッチメントJSONが付加される', () => {
      const result = applyRandomToneAttachmentToMml('o4 l8 cde');
      const newlineIdx = result.indexOf('\n');
      expect(newlineIdx).toBeGreaterThan(0);
      const firstLine = result.slice(0, newlineIdx);
      const rest = result.slice(newlineIdx + 1);
      expect(firstLine.startsWith('[')).toBe(true);
      expect(rest).toBe('@0 o4 l8 cde');
    });

    it('先頭行はパース可能なJSONである', () => {
      const result = applyRandomToneAttachmentToMml('o4 cde');
      const firstLine = result.slice(0, result.indexOf('\n'));
      const parsed = JSON.parse(firstLine) as unknown[];
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBe(1);
    });

    it('アタッチメントJSONはToneAttachmentEntry形式を持つ', () => {
      const result = applyRandomToneAttachmentToMml('o4 cde');
      const firstLine = result.slice(0, result.indexOf('\n'));
      const parsed = JSON.parse(firstLine) as Array<{ ProgramChange: number; Tone: { events: unknown[] } }>;
      expect(parsed[0].ProgramChange).toBe(0);
      expect(Array.isArray(parsed[0].Tone.events)).toBe(true);
      expect(parsed[0].Tone.events.length).toBeGreaterThan(0);
    });

    it('空MMLのとき先頭にJSON行＋改行が付く', () => {
      const result = applyRandomToneAttachmentToMml('');
      expect(result.startsWith('[')).toBe(true);
      // 常に JSON+'\n' を返すことで extractAttachmentFromMml と整合する
      const newlineIdx = result.indexOf('\n');
      expect(newlineIdx).toBeGreaterThan(0);
      const afterNewline = result.slice(newlineIdx + 1);
      expect(afterNewline).toBe('');
    });

    it('@NのないMMLには@0が自動付与される', () => {
      const result = applyRandomToneAttachmentToMml('c');
      const mmlBody = result.slice(result.indexOf('\n') + 1);
      expect(mmlBody).toBe('@0 c');
    });

    it('既に@0があるMMLには@0が重複付与されない', () => {
      const result = applyRandomToneAttachmentToMml('@0 c');
      const mmlBody = result.slice(result.indexOf('\n') + 1);
      expect(mmlBody).toBe('@0 c');
    });

    it('既に@2などProgramChangeがあるMMLには@0が付与されない', () => {
      const result = applyRandomToneAttachmentToMml('@2 c');
      const mmlBody = result.slice(result.indexOf('\n') + 1);
      expect(mmlBody).toBe('@2 c');
    });

    it('途中に@Nが含まれるMMLには@0が付与されない', () => {
      const result = applyRandomToneAttachmentToMml('t150 v11 @2 c');
      const mmlBody = result.slice(result.indexOf('\n') + 1);
      expect(mmlBody).toBe('t150 v11 @2 c');
    });

    it('既にアタッチメントJSONがある場合は二重付与されない', () => {
      const first = applyRandomToneAttachmentToMml('o4 cde');
      const second = applyRandomToneAttachmentToMml(first);
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
