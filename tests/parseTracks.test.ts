import { describe, it, expect } from 'vitest';
import { parseTracks } from '../src/parsers/mixParser';

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

  it('mmlabcトラックを解析する', () => {
    const tracks = parseTracks('mmlabc cde');
    expect(tracks).toHaveLength(1);
    expect(tracks[0].type).toBe('MMLABC');
    expect(tracks[0].text).toBe('cde');
  });

  it('mmlabcキーワードは大文字小文字を区別しない', () => {
    const tracks = parseTracks('MMLABC cde');
    expect(tracks).toHaveLength(1);
    expect(tracks[0].type).toBe('MMLABC');
    expect(tracks[0].text).toBe('cde');
  });

  it('chordトラックを解析する', () => {
    const tracks = parseTracks('chord C-Am-F-G');
    expect(tracks).toHaveLength(1);
    expect(tracks[0].type).toBe('CHORD');
    expect(tracks[0].text).toBe('C-Am-F-G');
  });

  it('chordキーワードは大文字小文字を区別しない', () => {
    const tracks = parseTracks('Chord C-Am-F-G');
    expect(tracks).toHaveLength(1);
    expect(tracks[0].type).toBe('CHORD');
    expect(tracks[0].text).toBe('C-Am-F-G');
  });

  it('mmlabcとYM2151の複数トラックを解析する', () => {
    const tracks = parseTracks('mmlabc cde;\nYM2151 rc');
    expect(tracks).toHaveLength(2);
    expect(tracks[0]).toEqual({ type: 'MMLABC', text: 'cde' });
    expect(tracks[1]).toEqual({ type: 'YM2151', text: 'rc' });
  });

  it('chordとVOICEVOXの複数トラックを解析する', () => {
    const tracks = parseTracks('chord C-Am-F-G;\nVOICEVOX ずんだもんなのだ');
    expect(tracks).toHaveLength(2);
    expect(tracks[0]).toEqual({ type: 'CHORD', text: 'C-Am-F-G' });
    expect(tracks[1]).toEqual({ type: 'VOICEVOX', text: 'ずんだもんなのだ' });
  });

  it('chord YM2151トラックを解析する（targetEngine=YM2151）', () => {
    const tracks = parseTracks('chord YM2151 C-Am-F-G');
    expect(tracks).toHaveLength(1);
    expect(tracks[0].type).toBe('CHORD');
    expect(tracks[0].text).toBe('C-Am-F-G');
    expect(tracks[0].targetEngine).toBe('YM2151');
  });

  it('chord Tone.jsトラックを解析する（targetEngine=TONE_JS）', () => {
    const tracks = parseTracks('chord Tone.js I IV V');
    expect(tracks).toHaveLength(1);
    expect(tracks[0].type).toBe('CHORD');
    expect(tracks[0].text).toBe('I IV V');
    expect(tracks[0].targetEngine).toBe('TONE_JS');
  });

  it('chord Tonejsトラックを解析する（targetEngine=TONE_JS）', () => {
    const tracks = parseTracks('chord Tonejs I IV V');
    expect(tracks).toHaveLength(1);
    expect(tracks[0].type).toBe('CHORD');
    expect(tracks[0].text).toBe('I IV V');
    expect(tracks[0].targetEngine).toBe('TONE_JS');
  });

  it('chord Surge XTトラックを解析する（targetEngine=SURGE_XT）', () => {
    const tracks = parseTracks('chord Surge XT I IV V');
    expect(tracks).toHaveLength(1);
    expect(tracks[0].type).toBe('CHORD');
    expect(tracks[0].text).toBe('I IV V');
    expect(tracks[0].targetEngine).toBe('SURGE_XT');
  });

  it('chord SurgeXTトラックを解析する（targetEngine=SURGE_XT、スペースなし）', () => {
    const tracks = parseTracks('chord SurgeXT I IV V');
    expect(tracks).toHaveLength(1);
    expect(tracks[0].type).toBe('CHORD');
    expect(tracks[0].text).toBe('I IV V');
    expect(tracks[0].targetEngine).toBe('SURGE_XT');
  });

  it('chord mmlabcトラックを解析する（targetEngine=MMLABC）', () => {
    const tracks = parseTracks('chord mmlabc I IV V');
    expect(tracks).toHaveLength(1);
    expect(tracks[0].type).toBe('CHORD');
    expect(tracks[0].text).toBe('I IV V');
    expect(tracks[0].targetEngine).toBe('MMLABC');
  });

  it('Surge XT Chordトラックを解析する（targetEngine=SURGE_XT）', () => {
    const tracks = parseTracks('Surge XT Chord I IV V');
    expect(tracks).toHaveLength(1);
    expect(tracks[0].type).toBe('CHORD');
    expect(tracks[0].text).toBe('I IV V');
    expect(tracks[0].targetEngine).toBe('SURGE_XT');
  });

  it('SurgeXT Chordトラックを解析する（targetEngine=SURGE_XT、スペースなし）', () => {
    const tracks = parseTracks('SurgeXT Chord I IV V');
    expect(tracks).toHaveLength(1);
    expect(tracks[0].type).toBe('CHORD');
    expect(tracks[0].text).toBe('I IV V');
    expect(tracks[0].targetEngine).toBe('SURGE_XT');
  });

  it('chord+engineトラックはtargetEngineなしのchordトラックと共存できる', () => {
    const tracks = parseTracks('chord C-Am-F-G;\nchord YM2151 I IV V');
    expect(tracks).toHaveLength(2);
    expect(tracks[0]).toEqual({ type: 'CHORD', text: 'C-Am-F-G' });
    expect(tracks[1].type).toBe('CHORD');
    expect(tracks[1].text).toBe('I IV V');
    expect(tracks[1].targetEngine).toBe('YM2151');
  });

  it('mmlabcトラックの後続キーワードなしトラックはmmlabcを引き継ぐ', () => {
    const tracks = parseTracks('mmlabc cde;fga');
    expect(tracks).toHaveLength(2);
    expect(tracks[0].type).toBe('MMLABC');
    expect(tracks[1].type).toBe('MMLABC');
    expect(tracks[1].text).toBe('fga');
  });
});
