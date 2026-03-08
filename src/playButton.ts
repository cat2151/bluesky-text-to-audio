import * as ABCJS from 'abcjs';
import { parse as mml2abcParse } from './mml2abc.mjs';
import type { SequencerNodes } from './types';
import { loadTone } from './loaders/tone';
import { loadSequencer } from './loaders/sequencer';
import { parseMmlViaLibrary } from './loaders/mmlToJson';
import { playWithYm2151 } from './loaders/ym2151';
import { chordToMml } from './chordToMml';
import { getPostText } from './postText';

const LOG_PREFIX = '[BTA:playButton]';

// ---- 投稿テキストからモードを自動検出 ----
function detectModeFromText(text: string): { mode: PlayMode; cleanedText: string } {
  const lines = text.split('\n');
  if (!text.trim()) return { mode: 'voicevox', cleanedText: text };

  const firstLine = lines[0];
  const lastLine = lines[lines.length - 1];

  const checks: [RegExp, PlayMode][] = [
    [/Chord|コード/, 'chord2mml'],
    [/YM2151|OPM/, 'ym2151'],
    [/Tonejs|Tone\.js/, 'tonejs'],
    [/MML/, 'mmlabc'],
    [/abc/, 'abcjs'],
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

// ---- モジュールレベルのAudioContext（再利用） ----
let sharedAudioContext: AudioContext | null = null;
function getAudioContext(): AudioContext {
  if (!sharedAudioContext || sharedAudioContext.state === 'closed') {
    sharedAudioContext = new AudioContext();
  }
  return sharedAudioContext;
}

// ---- 処理済み投稿を管理 ----
const processedPosts = new WeakSet<HTMLElement>();

// ---- 選択中モード（投稿間で共有） ----
type PlayMode = 'voicevox' | 'mmlabc' | 'abcjs' | 'chord2mml' | 'tonejs' | 'ym2151' | 'textarea';
let selectedMode: PlayMode = 'voicevox';

const menuItems: { mode: PlayMode; label: string }[] = [
  { mode: 'voicevox',  label: '🔊 投稿を読み上げる' },
  { mode: 'mmlabc',   label: '🎵 mmlabcでplay' },
  { mode: 'abcjs',    label: '▶ abcjsでplay' },
  { mode: 'chord2mml', label: '🎸 chord2mmlでplay' },
  { mode: 'tonejs',   label: '🎹 Tone.jsでplay' },
  { mode: 'ym2151',   label: '🎶 YM2151でplay' },
  { mode: 'textarea', label: '📝 textareaを開く' },
];

// ---- ドキュメントクリックでメニューを閉じる（一度だけ登録） ----
// キャプチャフェーズで登録するが、ドロップダウンボタンやメニュー自身のクリックは無視する
document.addEventListener('click', (e: MouseEvent) => {
  const target = e.target as Element | null;
  if (target?.closest('[data-bta-drop]') || target?.closest('[data-bta-menu]')) return;
  document.querySelectorAll<HTMLElement>('[data-bta-menu]').forEach(m => {
    m.style.display = 'none';
    const row = m.closest('[data-bta-row]');
    row?.querySelector<HTMLButtonElement>('[data-bta-drop]')?.setAttribute('aria-expanded', 'false');
  });
}, true);

// ---- DOM から削除されたplayボタンのaria-labelを同期するためのMutationObserver ----
// 削除されたpost内のplayボタンはDOMから消えるので、querySelectorAllで常にliveに参照する
// （メモリリーク対策：Setは使わずDOMから都度クエリする）

// ---- playボタン行とtextareaを追加 ----
export function addPlayButton(postEl: HTMLElement): void {
  if (processedPosts.has(postEl)) return;
  processedPosts.add(postEl);

  // ---- 投稿テキストからモードを自動検出（初期値） ----
  const rawPostText = getPostText(postEl);
  const { mode: detectedMode, cleanedText: detectedCleanedText } = detectModeFromText(rawPostText);

  // ---- playボタン（SVG三角） ----
  const playBtn = document.createElement('button');
  playBtn.type = 'button';
  playBtn.setAttribute('data-bta-play', '');
  playBtn.style.cssText = `
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    padding: 0;
    background: #0085ff;
    color: #fff;
    border: none;
    border-radius: 4px 0 0 4px;
    cursor: pointer;
    z-index: 1;
    flex-shrink: 0;
  `;
  playBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 16 16" fill="white" xmlns="http://www.w3.org/2000/svg"><polygon points="4,2 14,8 4,14"/></svg>`;
  const initialPlayLabel = menuItems.find(m => m.mode === detectedMode)?.label ?? '再生';
  playBtn.title = initialPlayLabel;
  playBtn.setAttribute('aria-label', initialPlayLabel);
  playBtn.dataset.btaMode = detectedMode;

  // ---- ドロップダウン矢印ボタン ----
  const dropBtn = document.createElement('button');
  dropBtn.type = 'button';
  dropBtn.setAttribute('data-bta-drop', '');
  dropBtn.style.cssText = `
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 32px;
    padding: 0;
    background: #0085ff;
    color: #fff;
    border: none;
    border-left: 1px solid rgba(255,255,255,0.3);
    border-radius: 0 4px 4px 0;
    cursor: pointer;
    z-index: 1;
    flex-shrink: 0;
  `;
  dropBtn.innerHTML = `<svg width="10" height="10" viewBox="0 0 10 10" fill="white" xmlns="http://www.w3.org/2000/svg"><polygon points="1,3 9,3 5,8"/></svg>`;
  dropBtn.title = 'メニューを開く';
  dropBtn.setAttribute('aria-label', 'メニューを開く');
  dropBtn.setAttribute('aria-haspopup', 'menu');
  dropBtn.setAttribute('aria-expanded', 'false');

  // ---- ポップアップメニュー ----
  const menu = document.createElement('div');
  menu.setAttribute('data-bta-menu', '');
  menu.style.cssText = `
    display: none;
    position: absolute;
    top: 100%;
    left: 0;
    background: #fff;
    border: 1px solid #ccc;
    border-radius: 4px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 9999;
    min-width: 180px;
    padding: 4px 0;
  `;

  for (const item of menuItems) {
    const menuItem = document.createElement('button');
    menuItem.type = 'button';
    menuItem.setAttribute('data-bta-menu-item', item.mode);
    menuItem.textContent = item.label;
    menuItem.style.cssText = `
      display: block;
      width: 100%;
      padding: 8px 14px;
      background: none;
      border: none;
      text-align: left;
      font-size: 13px;
      cursor: pointer;
      color: #000;
      white-space: nowrap;
    `;
    menuItem.addEventListener('mouseenter', () => {
      menuItem.style.background = '#e8f0fe';
    });
    menuItem.addEventListener('mouseleave', () => {
      menuItem.style.background = 'none';
    });
    menuItem.addEventListener('click', e => {
      e.stopPropagation();
      selectedMode = item.mode;
      // DOMに存在する全playボタンのtitle/aria-label/data-bta-modeを同期（Setを使わずliveクエリでメモリリーク防止）
      document.querySelectorAll<HTMLButtonElement>('[data-bta-play]').forEach(btn => {
        btn.title = item.label;
        btn.setAttribute('aria-label', item.label);
        btn.dataset.btaMode = item.mode;
      });
      menu.style.display = 'none';
      dropBtn.setAttribute('aria-expanded', 'false');
      // メニュー選択時に即座に実行する（disabled状態でもハンドラが動くようにdispatchEventを使う）
      // textareaモードはメニューから選んだ場合は「必ず開く」（閉じない）
      if (item.mode === 'textarea') {
        if (textarea.style.display === 'none') {
          playBtn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
        }
      } else {
        playBtn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      }
    });
    menu.append(menuItem);
  }

  // ボタン行コンテナ
  const row = document.createElement('div');
  row.setAttribute('data-bta-row', '');
  row.style.cssText = `
    display: flex;
    align-items: center;
    margin: 4px 0;
    position: relative;
  `;
  row.append(playBtn, dropBtn, menu);

  // textarea
  const textarea = document.createElement('textarea');
  textarea.setAttribute('data-bta-textarea', '');
  textarea.style.cssText = `
    display: none;
    width: 100%;
    box-sizing: border-box;
    margin: 4px 0;
    padding: 6px 8px;
    font-size: 13px;
    border: 1px solid #0085ff;
    border-radius: 4px;
    resize: vertical;
    min-height: 80px;
  `;

  // abcjs SVG表示用div
  const scoreDiv = document.createElement('div');
  scoreDiv.setAttribute('data-bta-score', '');
  scoreDiv.style.cssText = `
    display: none;
    background: white;
    color: black;
    border: 1px solid #ccc;
    border-radius: 4px;
    padding: 4px;
    margin: 4px 0;
  `;

  // textarea上でのポインタイベント（click/mousedown）が親要素に伝播してページ遷移しないようにする
  textarea.addEventListener('click', e => { e.stopPropagation(); });
  textarea.addEventListener('mousedown', e => { e.stopPropagation(); });

  // textarea編集1secデバウンスで自動play
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  textarea.addEventListener('input', () => {
    if (debounceTimer !== null) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      if (playBtn.dataset.btaMode !== 'textarea') {
        playBtn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      }
    }, 1000);
  });

  // 投稿ごとのシンセインスタンス
  let synthInstance: ABCJS.MidiBuffer | null = null;

  // ---- ABCテキストを五線譜表示し演奏する共通ヘルパー ----
  function renderAndPlay(abcText: string): void {
    scoreDiv.style.display = 'block';
    const tuneObjects = ABCJS.renderAbc(scoreDiv, abcText);
    const visualObj = tuneObjects[0];
    if (!visualObj) return;

    if (ABCJS.synth.supportsAudio()) {
      if (!synthInstance) {
        synthInstance = new ABCJS.synth.CreateSynth();
      } else {
        // 既存のシンセが再生中の場合は、再初期化前に必ず停止する
        synthInstance.stop();
      }
      synthInstance
        .init({ visualObj, options: {} })
        .then(() => synthInstance!.prime())
        .then(() => {
          // 再生開始（easyabcjs6と同様に stop() してから start() する）
          synthInstance!.stop();
          synthInstance!.start();
        })
        .catch((error: unknown) => {
          console.warn(LOG_PREFIX, 'Audio problem:', error);
        });
    } else {
      console.error(LOG_PREFIX, 'Audio is not supported in this browser.');
    }
  }

  // ---- ドロップダウン開閉 ----
  dropBtn.addEventListener('click', e => {
    e.stopPropagation();
    const isOpen = menu.style.display !== 'none';
    menu.style.display = isOpen ? 'none' : 'block';
    dropBtn.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
  });

  // ---- playボタン：選択中モードを実行 ----
  // 投稿ごとのSequencerNodesインスタンス（Tone.jsシーケンサー用）
  let tonejsNodes: SequencerNodes | null = null;

  playBtn.addEventListener('click', async e => {
    e.stopPropagation();
    const mode = (playBtn.dataset.btaMode as PlayMode) || selectedMode;

    if (mode === 'textarea') {
      if (textarea.style.display === 'none') {
        // 初回のみ投稿テキストをセット（ユーザー編集を保持）
        if (!textarea.value) {
          textarea.value = detectedCleanedText;
        }
        textarea.style.display = 'block';
      } else {
        textarea.style.display = 'none';
      }
      return;
    }

    // 未初期化の場合は投稿テキスト（検出行削除済み）をセット
    if (!textarea.value) {
      textarea.value = detectedCleanedText;
    }

    if (mode === 'mmlabc') {
      const mml = textarea.value;
      let abcText = '';
      try {
        abcText = mml2abcParse(mml);
      } catch (error) {
        console.error(LOG_PREFIX, 'MML parse error:', error);
        return;
      }
      renderAndPlay(abcText);
      return;
    }

    if (mode === 'abcjs') {
      renderAndPlay(textarea.value);
      return;
    }

    if (mode === 'chord2mml') {
      const chord = textarea.value;
      let abcText = '';
      try {
        const mml = await chordToMml(chord);
        abcText = mml2abcParse(mml);
      } catch (error) {
        console.error(LOG_PREFIX, 'chord2mml error (load or parse):', error);
        return;
      }
      renderAndPlay(abcText);
      return;
    }

    if (mode === 'tonejs') {
      const mml = textarea.value;
      let Tone;
      let sequencer;
      try {
        [Tone, sequencer] = await Promise.all([loadTone(), loadSequencer()]);
      } catch (e2: unknown) {
        console.error(LOG_PREFIX, 'Tone.js または tonejs-json-sequencer の読み込みに失敗しました:', e2);
        return;
      }
      let sequence;
      try {
        sequence = await parseMmlViaLibrary(mml);
      } catch (e2: unknown) {
        console.error(LOG_PREFIX, 'MML parse error:', e2);
        return;
      }
      try {
        await Tone.start();
        if (!tonejsNodes) {
          tonejsNodes = new sequencer.SequencerNodes();
        }
        await sequencer.playSequence(Tone, tonejsNodes, sequence);
        Tone.Transport.start();
      } catch (e2: unknown) {
        console.error(LOG_PREFIX, 'Tone.js play error:', e2);
      }
      return;
    }

    if (mode === 'ym2151') {
      const mml = textarea.value;
      try {
        await playWithYm2151(mml);
      } catch (e2: unknown) {
        console.error(LOG_PREFIX, 'YM2151 play error:', e2);
      }
      return;
    }

    if (mode === 'voicevox') {
      let text = textarea.value;
      if (!text) {
        text = detectedCleanedText;
        textarea.value = text;
      }
      if (!text) return;

      playBtn.disabled = true;
      try {
        const response = await new Promise<{ success: boolean; audio?: string; error?: string }>(
          (resolve, reject) => {
            chrome.runtime.sendMessage({ type: 'speak', text }, res => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(res as { success: boolean; audio?: string; error?: string });
              }
            });
          },
        );

        if (!response.success || !response.audio) {
          console.error(LOG_PREFIX, 'VOICEVOX error:', response.error);
          return;
        }

        const binaryString = atob(response.audio);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const audioContext = getAudioContext();
        if (audioContext.state === 'suspended') {
          await audioContext.resume();
        }
        const decoded = await audioContext.decodeAudioData(bytes.buffer);
        const source = audioContext.createBufferSource();
        source.buffer = decoded;
        source.connect(audioContext.destination);
        source.onended = () => { source.disconnect(); };
        source.start();
      } catch (err: unknown) {
        console.error(LOG_PREFIX, 'VOICEVOX error:', err);
      } finally {
        playBtn.disabled = false;
      }
    }
  });

  const wrapper = document.createElement('div');
  wrapper.setAttribute('data-bta-wrapper', '');
  wrapper.append(row, textarea, scoreDiv);

  postEl.prepend(wrapper);
}
