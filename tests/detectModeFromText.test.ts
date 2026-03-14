import { describe, it, expect } from 'vitest';
import { detectModeFromText } from '../src/detectModeFromText';

describe('detectModeFromText', () => {
  it('空テキストはvoicevoxを返す', () => {
    const result = detectModeFromText('');
    expect(result.mode).toBe('voicevox');
    expect(result.cleanedText).toBe('');
  });

  it('空白のみはvoicevoxを返す', () => {
    const result = detectModeFromText('   ');
    expect(result.mode).toBe('voicevox');
  });

  it('先頭行がMMLのときmmlabc', () => {
    const result = detectModeFromText('MML\ncde');
    expect(result.mode).toBe('mmlabc');
    expect(result.cleanedText).toBe('cde');
  });

  it('末尾行がMMLのときmmlabc', () => {
    const result = detectModeFromText('cde\nMML');
    expect(result.mode).toBe('mmlabc');
    expect(result.cleanedText).toBe('cde');
  });

  it('先頭行がChordのときchord2mml', () => {
    const result = detectModeFromText('Chord\nAm F C G');
    expect(result.mode).toBe('chord2mml');
    expect(result.cleanedText).toBe('Am F C G');
  });

  it('先頭行がコードのときchord2mml', () => {
    const result = detectModeFromText('コード\nAm F C G');
    expect(result.mode).toBe('chord2mml');
    expect(result.cleanedText).toBe('Am F C G');
  });

  it('先頭行がYM2151のときym2151', () => {
    const result = detectModeFromText('YM2151\ncde');
    expect(result.mode).toBe('ym2151');
    expect(result.cleanedText).toBe('cde');
  });

  it('先頭行がOPMのときym2151', () => {
    const result = detectModeFromText('OPM\ncde');
    expect(result.mode).toBe('ym2151');
    expect(result.cleanedText).toBe('cde');
  });

  it('先頭行がTonejsのときtonejs', () => {
    const result = detectModeFromText('Tonejs\nsome text');
    expect(result.mode).toBe('tonejs');
    expect(result.cleanedText).toBe('some text');
  });

  it('先頭行がTone.jsのときtonejs', () => {
    const result = detectModeFromText('Tone.js\nsome text');
    expect(result.mode).toBe('tonejs');
    expect(result.cleanedText).toBe('some text');
  });

  it('末尾行がChordのときchord2mml', () => {
    const result = detectModeFromText('Am F C G\nChord');
    expect(result.mode).toBe('chord2mml');
    expect(result.cleanedText).toBe('Am F C G');
  });

  it('キーワードがない場合はvoicevox', () => {
    const result = detectModeFromText('普通のテキストです');
    expect(result.mode).toBe('voicevox');
    expect(result.cleanedText).toBe('普通のテキストです');
  });

  it('先頭行が優先される（先頭と末尾の両方にキーワードがある場合）', () => {
    // 先頭行がMML、末尾行がChord
    const result = detectModeFromText('MML\nsome text\nChord');
    expect(result.mode).toBe('mmlabc');
    expect(result.cleanedText).toBe('some text\nChord');
  });

  it('1行のみでキーワードがない場合はvoicevox', () => {
    const result = detectModeFromText('hello world');
    expect(result.mode).toBe('voicevox');
    expect(result.cleanedText).toBe('hello world');
  });

  it('1行のみで先頭行にキーワードがある場合は先頭行として検出', () => {
    // 1行のみの場合、末尾の検索はskipされる（lines.length > 1条件）
    const result = detectModeFromText('MML');
    expect(result.mode).toBe('mmlabc');
    expect(result.cleanedText).toBe('');
  });

  it('mixモード: VOICEVOX + YM2151 + Tone.jsのマルチトラック', () => {
    const text = 'VOICEVOX ずんだもんなのだ;\nYM2151 rc;\nTone.js rrg';
    const result = detectModeFromText(text);
    expect(result.mode).toBe('mix');
    expect(result.cleanedText).toBe(text);
  });

  it('mixモード: VOICEVOX + YM2151 + Tonejsのマルチトラック', () => {
    const text = 'VOICEVOX ずんだもんなのだ;\nYM2151 rc;\nTonejs rrg';
    const result = detectModeFromText(text);
    expect(result.mode).toBe('mix');
    expect(result.cleanedText).toBe(text);
  });

  it('mixモード: YM2151 から始まるマルチトラック', () => {
    const result = detectModeFromText('YM2151 rc;\nTone.js rrg');
    expect(result.mode).toBe('mix');
  });

  it('mixモード: YM2151 から始まるマルチトラック (Tonejs)', () => {
    const result = detectModeFromText('YM2151 rc;\nTonejs rrg');
    expect(result.mode).toBe('mix');
  });

  it('mixモード: Tone.js から始まるマルチトラック', () => {
    const result = detectModeFromText('Tone.js rrg;\nYM2151 cde');
    expect(result.mode).toBe('mix');
  });

  it('mixモード: Tonejs から始まるマルチトラック', () => {
    const result = detectModeFromText('Tonejs rrg;\nYM2151 cde');
    expect(result.mode).toBe('mix');
  });

  it('セミコロンがあってもキーワードなしはvoicevox', () => {
    const result = detectModeFromText('こんにちは; 世界');
    expect(result.mode).toBe('voicevox');
  });

  it('YM2151が先頭行だけ (セミコロンなし) はym2151', () => {
    const result = detectModeFromText('YM2151\ncde');
    expect(result.mode).toBe('ym2151');
    expect(result.cleanedText).toBe('cde');
  });

  it('先頭行がSurge XTのときsurgext', () => {
    const result = detectModeFromText('Surge XT\nhello world');
    expect(result.mode).toBe('surgext');
    expect(result.cleanedText).toBe('hello world');
  });

  it('先頭行がSurgeXTのときsurgext', () => {
    const result = detectModeFromText('SurgeXT\nhello world');
    expect(result.mode).toBe('surgext');
    expect(result.cleanedText).toBe('hello world');
  });

  it('mixモード: Surge XT から始まるマルチトラック', () => {
    const text = 'Surge XT hello;\nYM2151 rc';
    const result = detectModeFromText(text);
    expect(result.mode).toBe('mix');
    expect(result.cleanedText).toBe(text);
  });
});
