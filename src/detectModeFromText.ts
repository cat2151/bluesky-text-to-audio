import type { PlayMode } from './playModes';

// ---- 投稿テキストからモードを自動検出 ----
export function detectModeFromText(text: string): { mode: PlayMode; cleanedText: string } {
  const lines = text.split('\n');
  if (!text.trim()) return { mode: 'voicevox', cleanedText: text };

  const firstLine = lines[0];
  const lastLine = lines[lines.length - 1];

  // mixモード: セミコロン区切りで先頭trackがVOICEVOX/YM2151/Tone.js/Surge XTキーワードで始まる場合
  // または、chord+engineフォーマット（例: "chord YM2151 C", "Surge XT Chord I"）で始まる場合
  // キーワードはtrack内容と同行に書くため、cleanedTextはそのまま保持する
  if (text.includes(';')) {
    const firstTrack = text.split(';')[0].trim();
    if (
      /^(VOICEVOX|YM2151|Tonejs|Tone\.js|Surge\s*XT)\s/i.test(firstTrack) ||
      /^chord\s+(YM2151|Tone\.?js|Surge\s*XT|mmlabc)\s+/i.test(firstTrack) ||
      /^Surge\s*XT\s+Chord\s+/i.test(firstTrack)
    ) {
      return { mode: 'mix', cleanedText: text };
    }
  }

  // chord+engine単独（セミコロンなし）もmixモードとして扱う
  // 例: "chord YM2151 C", "Surge XT Chord I", "chord tone.js 3"
  if (
    /^chord\s+(YM2151|Tone\.?js|Surge\s*XT|mmlabc)\s+/i.test(firstLine) ||
    /^Surge\s*XT\s+Chord\s+/i.test(firstLine)
  ) {
    return { mode: 'mix', cleanedText: text };
  }

  const checks: [RegExp, PlayMode][] = [
    [/Chord|コード/, 'chord2mml'],
    [/YM2151|OPM/, 'ym2151'],
    [/Tonejs|Tone\.js/, 'tonejs'],
    [/MML/, 'mmlabc'],
    [/Surge\s*XT/i, 'surgext'],
  ];

  for (const [re, mode] of checks) {
    if (re.test(firstLine)) {
      return { mode, cleanedText: lines.slice(1).join('\n') };
    }
  }

  if (lines.length > 1) {
    for (const [re, mode] of checks) {
      if (re.test(lastLine)) {
        return { mode, cleanedText: lines.slice(0, -1).join('\n') };
      }
    }
  }

  return { mode: 'voicevox', cleanedText: text };
}
