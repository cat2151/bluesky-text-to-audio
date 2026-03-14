import { describe, it, expect } from 'vitest';
import { parseTracks } from '../src/mixParser';

describe('parseTracks', () => {
  it('VOICEVOXトラックを解析する', () => {
    const tracks = parseTracks('VOICEVOX ずんだもんなのだ');
    expect(tracks).toHaveLength(1);
    expect(tracks[0].type).toBe('VOICEVOX');
    expect(tracks[0].text).toBe('ずんだもんなのだ');
  });

  it('YM2151トラックを解析する', () => {
    const tracks = parseTracks('YM2151 rc');
    expect(tracks).toHaveLength(1);
    expect(tracks[0].type).toBe('YM2151');
    expect(tracks[0].text).toBe('rc');
  });

  it('Tone.jsトラックを解析する', () => {
    const tracks = parseTracks('Tone.js rrg');
    expect(tracks).toHaveLength(1);
    expect(tracks[0].type).toBe('TONE_JS');
    expect(tracks[0].text).toBe('rrg');
  });

  it('Tonejsトラックを解析する', () => {
    const tracks = parseTracks('Tonejs rrg');
    expect(tracks).toHaveLength(1);
    expect(tracks[0].type).toBe('TONE_JS');
    expect(tracks[0].text).toBe('rrg');
  });

  it('Surge XTトラックを解析する', () => {
    const tracks = parseTracks('Surge XT hello world');
    expect(tracks).toHaveLength(1);
    expect(tracks[0].type).toBe('SURGE_XT');
    expect(tracks[0].text).toBe('hello world');
  });

  it('SurgeXTトラックを解析する（スペースなし）', () => {
    const tracks = parseTracks('SurgeXT hello world');
    expect(tracks).toHaveLength(1);
    expect(tracks[0].type).toBe('SURGE_XT');
    expect(tracks[0].text).toBe('hello world');
  });

  it('セミコロン区切りで複数トラックを解析する（Surge XTを含む）', () => {
    const tracks = parseTracks('VOICEVOX ずんだもんなのだ;\nSurge XT hello;\nTone.js rrg');
    expect(tracks).toHaveLength(3);
    expect(tracks[0]).toEqual({ type: 'VOICEVOX', text: 'ずんだもんなのだ' });
    expect(tracks[1]).toEqual({ type: 'SURGE_XT', text: 'hello' });
    expect(tracks[2]).toEqual({ type: 'TONE_JS', text: 'rrg' });
  });

  it('セミコロン区切りで複数トラックを解析する', () => {
    const tracks = parseTracks('VOICEVOX ずんだもんなのだ;\nYM2151 rc;\nTone.js rrg');
    expect(tracks).toHaveLength(3);
    expect(tracks[0]).toEqual({ type: 'VOICEVOX', text: 'ずんだもんなのだ' });
    expect(tracks[1]).toEqual({ type: 'YM2151', text: 'rc' });
    expect(tracks[2]).toEqual({ type: 'TONE_JS', text: 'rrg' });
  });

  it('キーワードなしの先頭トラックはTone.jsがデフォルト', () => {
    const tracks = parseTracks('rrg');
    expect(tracks).toHaveLength(1);
    expect(tracks[0].type).toBe('TONE_JS');
    expect(tracks[0].text).toBe('rrg');
  });

  it('キーワードなしの2番目以降のトラックは前のtrackを引き継ぐ', () => {
    const tracks = parseTracks('YM2151 rc;cde');
    expect(tracks).toHaveLength(2);
    expect(tracks[0].type).toBe('YM2151');
    expect(tracks[1].type).toBe('YM2151');
    expect(tracks[1].text).toBe('cde');
  });

  it('空のセミコロン区切りは無視される', () => {
    const tracks = parseTracks('VOICEVOX hello;;YM2151 rc');
    expect(tracks).toHaveLength(2);
  });

  it('空文字列は空配列を返す', () => {
    const tracks = parseTracks('');
    expect(tracks).toHaveLength(0);
  });

  it('セミコロンのみは空配列を返す', () => {
    const tracks = parseTracks(';');
    expect(tracks).toHaveLength(0);
  });

  it('effectトラックを解析する', () => {
    const tracks = parseTracks('YM2151 cde;\neffect @PingPongDelay');
    expect(tracks).toHaveLength(2);
    expect(tracks[0]).toEqual({ type: 'YM2151', text: 'cde' });
    expect(tracks[1]).toEqual({ type: 'EFFECT', text: '@PingPongDelay' });
  });

  it('effectトラックは後続トラックのprevTypeを変えない', () => {
    const tracks = parseTracks('YM2151 cde;\neffect @PingPongDelay;\ncde');
    expect(tracks).toHaveLength(3);
    expect(tracks[0].type).toBe('YM2151');
    expect(tracks[1].type).toBe('EFFECT');
    expect(tracks[2].type).toBe('YM2151');
  });

  it('effectキーワードは大文字小文字を区別しない', () => {
    const tracks = parseTracks('Effect @PingPongDelay');
    expect(tracks).toHaveLength(1);
    expect(tracks[0].type).toBe('EFFECT');
    expect(tracks[0].text).toBe('@PingPongDelay');
  });
});
