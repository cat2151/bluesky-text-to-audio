import { describe, it, expect } from 'vitest';
import {
  getDefaultConfig,
  generateRandomToneString,
  generateRandomToneAttachment,
} from '../src/ym2151RandomTone';

describe('ym2151RandomTone', () => {
  describe('generateRandomToneString', () => {
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

    it('呼び出しのたびに異なるトーン文字列を生成する（確率的）', () => {
      const config = getDefaultConfig();
      const results = new Set<string>();
      for (let i = 0; i < 20; i++) {
        results.add(generateRandomToneString(config));
      }
      // 20回生成すれば少なくとも2種類以上のユニークなトーンが生成されるはず
      expect(results.size).toBeGreaterThan(1);
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
});
