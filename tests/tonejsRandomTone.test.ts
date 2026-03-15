import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  generateRandomTonejsMmlPrefix,
  applyRandomToneToMmlIfNeeded,
} from '../src/tonejsRandomTone';

describe('tonejsRandomTone', () => {
  describe('generateRandomTonejsMmlPrefix', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('@で始まるインストゥルメント名を返す', () => {
      const prefix = generateRandomTonejsMmlPrefix();
      expect(prefix).toMatch(/^@[A-Za-z]/);
    });

    it('乱数が0のとき最初のシンセから始まるMMLを返す（決定的）', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0);
      const prefix = generateRandomTonejsMmlPrefix();
      expect(prefix).toMatch(/^@[A-Za-z]/);
    });

    it('乱数が0.99のとき最後のシンセから始まるMMLを返す（決定的）', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.99);
      const prefix = generateRandomTonejsMmlPrefix();
      expect(prefix).toMatch(/^@[A-Za-z]/);
    });

    it('同じ乱数値であれば同じプレフィックスを返す（決定的）', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const first = generateRandomTonejsMmlPrefix();
      const second = generateRandomTonejsMmlPrefix();
      expect(first).toBe(second);
    });

    it('instrumentとeffectを合体したMMLを返す（@が複数含まれる）', () => {
      const prefix = generateRandomTonejsMmlPrefix();
      const atCount = (prefix.match(/@[A-Za-z]/g) ?? []).length;
      expect(atCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe('applyRandomToneToMmlIfNeeded', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('@指定がない場合、ランダムシンセプレフィックスを先頭に付加する', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0);
      const result = applyRandomToneToMmlIfNeeded('o4 l8 cde');
      expect(result).toMatch(/^@[A-Za-z]/);
      expect(result).toContain('o4 l8 cde');
    });

    it('空MMLにはプレフィックスのみを返す（末尾にMMLなし）', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0);
      const result = applyRandomToneToMmlIfNeeded('');
      expect(result).toMatch(/^@[A-Za-z]/);
    });

    it('@InstrumentJSON指定あり→そのまま返す', () => {
      const mml = '@FMSynth{"harmonicity": 3} o4 l8 cde';
      const result = applyRandomToneToMmlIfNeeded(mml);
      expect(result).toBe(mml);
    });

    it('@Instrument（JSON指定なし）があるときはそのまま返す', () => {
      const mml = '@FMSynth o4 cde';
      const result = applyRandomToneToMmlIfNeeded(mml);
      expect(result).toBe(mml);
    });

    it('@Effect（JSON指定なし）があるときはそのまま返す', () => {
      const mml = '@PingPongDelay o4 l8 cde';
      const result = applyRandomToneToMmlIfNeeded(mml);
      expect(result).toBe(mml);
    });

    it('エフェクトJSON指定がある場合はそのまま返す', () => {
      const mml = '@Reverb{"decay": 2} o4 l8 cde';
      const result = applyRandomToneToMmlIfNeeded(mml);
      expect(result).toBe(mml);
    });

    it('スペースを挟まない@Instrument{もそのまま返す', () => {
      const mml = '@FMSynth{"harmonicity":3} o4 l8 cde';
      const result = applyRandomToneToMmlIfNeeded(mml);
      expect(result).toBe(mml);
    });
  });
});
