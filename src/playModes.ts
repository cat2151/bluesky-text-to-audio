import { mmlTemplates } from './mmlTemplates';
import { chordTemplates } from './chordTemplates';
import { tonejsTemplates } from './tonejsTemplates';

export type PlayMode = 'voicevox' | 'mmlabc' | 'chord2mml' | 'tonejs' | 'ym2151' | 'mix' | 'textarea';

export type TemplateItem = { name: string; text: string };

export const menuItems: { mode: PlayMode; label: string }[] = [
  { mode: 'voicevox',  label: '🔊 投稿を読み上げる' },
  { mode: 'mmlabc',   label: '🎵 mmlabcでplay' },
  { mode: 'chord2mml', label: '🎸 chord2mmlでplay' },
  { mode: 'tonejs',   label: '🎹 Tone.jsでplay' },
  { mode: 'ym2151',   label: '🎶 YM2151でplay' },
  { mode: 'mix',      label: '🎚️ Mixでplay' },
  { mode: 'textarea', label: '📝 textareaを開く' },
];

// 各ライブラリのdemoで使われていたテンプレート（mmlabc/chord2mmlはvendoredファイルからインポート）
export const modeTemplates: Partial<Record<PlayMode, TemplateItem[]>> = {
  voicevox: [
    { name: 'サンプルテキスト', text: 'こんにちは、ずんだもんです。今日も元気に音声合成するのだ！' },
  ],
  mmlabc: mmlTemplates
    .filter(([, text]) => text !== '')
    .map(([name, text]) => ({ name, text })),
  chord2mml: chordTemplates
    .filter(([, text]) => text !== '')
    .map(([name, text]) => ({
      name,
      // easychord2mml.js の removeIndent と同じ処理（テンプレートリテラルのインデントを除去）
      text: text.split('\n').map(line => line.trim()).join('\n'),
    })),
  tonejs: tonejsTemplates.map(([name, text]) => ({ name, text })),
  ym2151: [
    // mmlabc互換MML
    { name: 'ドレミ', text: 'cde' },
    { name: 'ドミソシの和音', text: "v11 'c1egb'" },
    { name: 'メロディー', text: 'o4 l16 e f g+ a b a g+ f e8. <e8. >e8' },
  ],
  mix: [
    {
      name: 'VOICEVOX + YM2151 + Tone.js',
      text: 'VOICEVOX ずんだもんなのだ;\nYM2151 rc;\nTone.js rrg',
    },
  ],
};
