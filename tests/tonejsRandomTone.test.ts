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

    it('@で始まるシンセ名を返す', () => {
      const prefix = generateRandomTonejsMmlPrefix();
      expect(prefix).toMatch(/^@[A-Za-z]+$/);
    });

    it('乱数が0のとき最初のシンセを返す', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0);
      const prefix = generateRandomTonejsMmlPrefix();
      expect(prefix).toBe('@Synth');
    });

    it('乱数が0.99のとき最後のシンセを返す', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.99);
      const prefix = generateRandomTonejsMmlPrefix();
      expect(prefix).toBe('@MetalSynth');
    });

    it('同じ乱数値であれば同じシンセを返す（決定的）', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const first = generateRandomTonejsMmlPrefix();
      const second = generateRandomTonejsMmlPrefix();
      expect(first).toBe(second);
    });
  });

  describe('applyRandomToneToMmlIfNeeded', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('MMLに@Instrument{がない場合、ランダムシンセプレフィックスを先頭に付加する', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0);
      const result = applyRandomToneToMmlIfNeeded('o4 l8 cde');
      expect(result).toBe('@Synth o4 l8 cde');
    });

    it('MMLに@Instrument{がある場合（JSON指定あり）、そのまま返す', () => {
      const mml = '@FMSynth{"harmonicity": 3} o4 l8 cde';
      const result = applyRandomToneToMmlIfNeeded(mml);
      expect(result).toBe(mml);
    });

    it('空MMLにはプレフィックスのみを返す（末尾スペースなし）', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0);
      const result = applyRandomToneToMmlIfNeeded('');
      expect(result).toBe('@Synth');
    });

    it('@Instrument（JSON指定なし）にもプレフィックスを付加する', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0);
      // @FMSynth without JSON args is not a JSON spec → random tone is prepended
      const result = applyRandomToneToMmlIfNeeded('@FMSynth o4 cde');
      expect(result).toBe('@Synth @FMSynth o4 cde');
    });

    it('エフェクトJSON指定がある場合はそのまま返す', () => {
      const mml = '@Reverb{"decay": 2} o4 l8 cde';
      const result = applyRandomToneToMmlIfNeeded(mml);
      expect(result).toBe(mml);
    });

    it('スペースを挟まない@Instrument{もJSON指定として認識する', () => {
      const mml = '@FMSynth{"harmonicity":3} o4 l8 cde';
      const result = applyRandomToneToMmlIfNeeded(mml);
      expect(result).toBe(mml);
    });
  });
});
