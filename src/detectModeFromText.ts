import type { PlayMode } from './playModes';

// ---- 投稿テキストからモードを自動検出 ----
export function detectModeFromText(text: string): { mode: PlayMode; cleanedText: string } {
  const lines = text.split('\n');
  if (!text.trim()) return { mode: 'voicevox', cleanedText: text };

  const firstLine = lines[0];
  const lastLine = lines[lines.length - 1];

  // mixモード: セミコロン区切りで先頭trackがVOICEVOX/YM2151/Tone.jsキーワードで始まる場合
  // キーワードはtrack内容と同行に書くため、cleanedTextはそのまま保持する
  if (text.includes(';')) {
    const firstTrack = text.split(';')[0].trim();
    if (/^(VOICEVOX|YM2151|Tonejs|Tone\.js)\s/.test(firstTrack)) {
      return { mode: 'mix', cleanedText: text };
    }
  }

  const checks: [RegExp, PlayMode][] = [
    [/Chord|コード/, 'chord2mml'],
    [/YM2151|OPM/, 'ym2151'],
    [/Tonejs|Tone\.js/, 'tonejs'],
    [/MML/, 'mmlabc'],
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
