// ---- MixモードのトラックParsing ----
// セミコロンでtrack分割し、各trackのtype(VOICEVOX/YM2151/TONE_JS/SURGE_XT/MMLABC/CHORD/EFFECT)とtextを返す。
// ブラウザAPIに依存しない純粋な関数のため、単体テスト可能。

export type TrackType = 'VOICEVOX' | 'YM2151' | 'TONE_JS' | 'SURGE_XT' | 'MMLABC' | 'CHORD' | 'EFFECT';

// CHORDトラックのターゲットエンジン（chord2mml後にどのエンジンでレンダリングするか）
export type ChordTargetEngine = 'YM2151' | 'TONE_JS' | 'SURGE_XT' | 'MMLABC';

export interface Track {
  type: TrackType;
  text: string;
  targetEngine?: ChordTargetEngine;
}

// ---- セミコロン区切りテキストをTrack配列に変換 ----
// 例: 'VOICEVOX ずんだもんなのだ;\nYM2151 rc;\nTone.js rrg'
// → [{ type: 'VOICEVOX', text: 'ずんだもんなのだ' }, { type: 'YM2151', text: 'rc' }, { type: 'TONE_JS', text: 'rrg' }]
// chord+engineフォーマット例:
//   'chord YM2151 C-Am-F-G' → { type: 'CHORD', text: 'C-Am-F-G', targetEngine: 'YM2151' }
//   'Surge XT Chord I-IV-V' → { type: 'CHORD', text: 'I-IV-V', targetEngine: 'SURGE_XT' }
export function parseTracks(text: string): Track[] {
  const rawTracks = text.split(';').map(t => t.trim()).filter(t => t !== '');
  let prevType: TrackType = 'TONE_JS';

  return rawTracks.map((raw, i) => {
    let type: TrackType;
    let trackText: string;
    let targetEngine: ChordTargetEngine | undefined;

    if (/^VOICEVOX\s+/.test(raw)) {
      type = 'VOICEVOX';
      trackText = raw.replace(/^VOICEVOX\s+/, '');
    } else if (/^YM2151\s+/.test(raw)) {
      type = 'YM2151';
      trackText = raw.replace(/^YM2151\s+/, '');
    } else if (/^Surge\s*XT\s+Chord\s+/i.test(raw)) {
      // "Surge XT Chord <chord>" → chord+engine (SurgeXT). Surge XTチェックより先に評価する。
      type = 'CHORD';
      targetEngine = 'SURGE_XT';
      trackText = raw.replace(/^Surge\s*XT\s+Chord\s+/i, '');
    } else if (/^Surge\s*XT\s+/i.test(raw)) {
      type = 'SURGE_XT';
      trackText = raw.replace(/^Surge\s*XT\s+/i, '');
    } else if (/^mmlabc\s+/i.test(raw)) {
      type = 'MMLABC';
      trackText = raw.replace(/^mmlabc\s+/i, '');
    } else if (/^chord\s+YM2151\s+/i.test(raw)) {
      // "chord YM2151 <chord>" → chord+engine (YM2151)
      type = 'CHORD';
      targetEngine = 'YM2151';
      trackText = raw.replace(/^chord\s+YM2151\s+/i, '');
    } else if (/^chord\s+Tone\.?js\s+/i.test(raw)) {
      // "chord Tone.js <chord>" or "chord Tonejs <chord>" → chord+engine (Tone.js)
      type = 'CHORD';
      targetEngine = 'TONE_JS';
      trackText = raw.replace(/^chord\s+Tone\.?js\s+/i, '');
    } else if (/^chord\s+Surge\s*XT\s+/i.test(raw)) {
      // "chord Surge XT <chord>" or "chord SurgeXT <chord>" → chord+engine (Surge XT)
      type = 'CHORD';
      targetEngine = 'SURGE_XT';
      trackText = raw.replace(/^chord\s+Surge\s*XT\s+/i, '');
    } else if (/^chord\s+mmlabc\s+/i.test(raw)) {
      // "chord mmlabc <chord>" → chord+engine (mmlabc/abcjs)
      type = 'CHORD';
      targetEngine = 'MMLABC';
      trackText = raw.replace(/^chord\s+mmlabc\s+/i, '');
    } else if (/^chord\s+/i.test(raw)) {
      type = 'CHORD';
      trackText = raw.replace(/^chord\s+/i, '');
    } else if (/^Tone\.?js\s+/i.test(raw)) {
      type = 'TONE_JS';
      trackText = raw.replace(/^Tone\.?js\s+/i, '');
    } else if (/^effect\s+/i.test(raw)) {
      // EFFECTはメタデータ扱い。prevTypeを変えない。
      return { type: 'EFFECT', text: raw.replace(/^effect\s+/i, '') };
    } else {
      // デフォルト: 先頭trackはTone.js、以降は前のtrackを引き継ぐ
      type = i === 0 ? 'TONE_JS' : prevType;
      trackText = raw;
    }

    prevType = type;
    const track: Track = { type, text: trackText };
    if (targetEngine !== undefined) track.targetEngine = targetEngine;
    return track;
  });
}
