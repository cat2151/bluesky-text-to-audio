import { AbcjsPlayer } from './loaders/abcjsPlayer';
import { getPostText } from './postText';
import { detectModeFromText } from './detectModeFromText';
import { type PlayMode, menuItems, modeTemplates } from './playModes';
import { createErrorToast } from './errorToast';
import {
  type TonejsRef,
  playMmlabcMode,
  playChord2mmlMode,
  playToneJsMode,
  playYm2151Mode,
  playMixMode as playMixModeHandler,
  playVoicevoxMode,
  exportWavHandler,
} from './playModeHandlers';

const LOG_PREFIX = '[BTA:playButton]';

// ---- 処理済み投稿を管理 ----
const processedPosts = new WeakSet<HTMLElement>();

// ---- 選択中モード（投稿間で共有） ----
let selectedMode: PlayMode = 'voicevox';

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

  // 投稿テキストのauto-fill済みかどうか（一度でも再生またはtextareaを開いたらtrue）
  // trueになると、textareaが空でもdetectedCleanedTextで上書きしない
  let textareaInitialized = false;

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
    border-radius: 4px 0 0 0;
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
    border-radius: 0 4px 0 0;
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
      menu.style.display = 'none';
      dropBtn.setAttribute('aria-expanded', 'false');
      // textareaモードはメニューから選んだ場合は「必ず開く」（閉じない）
      // selectedModeやdata-bta-modeは変えない（再生モードを保持する）
      if (item.mode === 'textarea') {
        if (textarea.style.display === 'none') {
          if (!textareaInitialized && !textarea.value) {
            textarea.value = detectedCleanedText;
          }
          textareaInitialized = true;
          textarea.style.display = 'block';
          showTemplateSelectIfNeeded();
          showWavExportBtnIfNeeded();
        }
        return;
      }
      selectedMode = item.mode;
      // DOMに存在する全playボタンのtitle/aria-label/data-bta-modeを同期（Setを使わずliveクエリでメモリリーク防止）
      document.querySelectorAll<HTMLButtonElement>('[data-bta-play]').forEach(btn => {
        btn.title = item.label;
        btn.setAttribute('aria-label', item.label);
        btn.dataset.btaMode = item.mode;
      });
      // モード変更時にtextareaが開いていればテンプレートプルダウンを更新
      if (textarea.style.display !== 'none') {
        showTemplateSelectIfNeeded();
        showWavExportBtnIfNeeded();
      }
      // メニュー選択時に即座に実行する（disabled状態でもハンドラが動くようにdispatchEventを使う）
      playBtn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    });
    menu.append(menuItem);
  }

  // ---- リセットボタン（投稿テキストでtextareaをリセット） ----
  const separator = document.createElement('hr');
  separator.style.cssText = `
    margin: 4px 0;
    border: none;
    border-top: 1px solid #e0e0e0;
  `;
  menu.append(separator);

  const resetBtn = document.createElement('button');
  resetBtn.type = 'button';
  resetBtn.setAttribute('data-bta-menu-item', 'reset');
  resetBtn.textContent = '🔄 リセット';
  resetBtn.style.cssText = `
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
  resetBtn.addEventListener('mouseenter', () => {
    resetBtn.style.background = '#e8f0fe';
  });
  resetBtn.addEventListener('mouseleave', () => {
    resetBtn.style.background = 'none';
  });
  resetBtn.addEventListener('click', e => {
    e.stopPropagation();
    const wasVisible = textarea.style.display !== 'none';
    textarea.value = detectedCleanedText;
    if (wasVisible) {
      textarea.style.display = 'block';
      showTemplateSelectIfNeeded();
      showWavExportBtnIfNeeded();
    }
    menu.style.display = 'none';
    dropBtn.setAttribute('aria-expanded', 'false');
  });
  menu.append(resetBtn);

  // ボタン行コンテナ
  const row = document.createElement('div');
  row.setAttribute('data-bta-row', '');
  row.style.cssText = `
    display: flex;
    align-items: center;
    margin: 4px 0 0 0;
    position: relative;
  `;

  // ---- テンプレートプルダウン（textareaが開いている時のみ表示） ----
  const templateSelect = document.createElement('select');
  templateSelect.setAttribute('data-bta-template-select', '');
  templateSelect.style.cssText = `
    display: none;
    margin-left: 8px;
    padding: 4px 6px;
    font-size: 12px;
    border: 1px solid #ccc;
    border-radius: 4px;
    cursor: pointer;
    max-width: 200px;
  `;

  function updateTemplateSelect(): void {
    const mode = (playBtn.dataset.btaMode as PlayMode) || selectedMode;
    const templates = modeTemplates[mode] ?? [];
    templateSelect.innerHTML = '';
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'テンプレート';
    placeholder.disabled = true;
    placeholder.selected = true;
    templateSelect.append(placeholder);
    for (const tmpl of templates) {
      const option = document.createElement('option');
      option.value = tmpl.text;
      option.textContent = tmpl.name;
      templateSelect.append(option);
    }
  }

  function showTemplateSelectIfNeeded(): void {
    const mode = (playBtn.dataset.btaMode as PlayMode) || selectedMode;
    const templates = modeTemplates[mode] ?? [];
    if (templates.length > 0) {
      updateTemplateSelect();
      templateSelect.style.display = 'inline-block';
    } else {
      templateSelect.style.display = 'none';
    }
  }

  templateSelect.addEventListener('change', () => {
    const selected = templateSelect.value;
    if (!selected) return;
    textarea.value = selected;
    textarea.style.display = 'block';
    if (playBtn.dataset.btaMode !== 'textarea') {
      playBtn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    }
  });

  // ---- WAV exportボタン（ym2151モードでtextareaが開いている時のみ表示） ----
  const wavExportBtn = document.createElement('button');
  wavExportBtn.type = 'button';
  wavExportBtn.setAttribute('data-bta-wav-export', '');
  wavExportBtn.textContent = '💾 WAV';
  wavExportBtn.title = 'WAVファイルをエクスポート';
  wavExportBtn.setAttribute('aria-label', 'WAVファイルをエクスポート');
  wavExportBtn.style.cssText = `
    display: none;
    margin-left: 8px;
    padding: 4px 8px;
    font-size: 12px;
    border: 1px solid #ccc;
    border-radius: 4px;
    cursor: pointer;
    background: white;
    white-space: nowrap;
  `;

  function showWavExportBtnIfNeeded(): void {
    const mode = (playBtn.dataset.btaMode as PlayMode) || selectedMode;
    if (mode === 'ym2151' && textarea.style.display !== 'none') {
      wavExportBtn.style.display = 'inline-block';
    } else {
      wavExportBtn.style.display = 'none';
    }
  }

  row.append(playBtn, dropBtn, menu, templateSelect, wavExportBtn);

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

  // textarea上でのマウスイベント（click/mousedown）が親要素に伝播してページ遷移しないようにする
  textarea.addEventListener('click', e => { e.stopPropagation(); });
  textarea.addEventListener('mousedown', e => { e.stopPropagation(); });

  // templateSelect上でのマウスイベント（click/mousedown）が親要素に伝播してページ遷移しないようにする
  templateSelect.addEventListener('click', e => { e.stopPropagation(); });
  templateSelect.addEventListener('mousedown', e => { e.stopPropagation(); });

  // wavExportBtn上でのマウスイベント（click/mousedown）が親要素に伝播してページ遷移しないようにする
  wavExportBtn.addEventListener('click', async e => {
    e.stopPropagation();
    const mml = textarea.value;
    if (!mml) return;
    wavExportBtn.disabled = true;
    try {
      await exportWavHandler(mml, showErrorToast);
    } finally {
      wavExportBtn.disabled = false;
    }
  });
  wavExportBtn.addEventListener('mousedown', e => { e.stopPropagation(); });

  // ---- エラートーストを表示する ----
  const showErrorToast = createErrorToast(row);

  // ---- エラー時にtextareaを表示してトーストを出す ----
  function handleError(logLabel: string, message: string, error: unknown): void {
    console.error(LOG_PREFIX, logLabel, error);
    textareaInitialized = true;
    textarea.style.display = 'block';
    showTemplateSelectIfNeeded();
    showWavExportBtnIfNeeded();
    showErrorToast(message);
  }

  // textarea編集デバウンスで自動play（ym2151はレンダリング中にキーボード入力が止まるため1sec、それ以外は0）
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  textarea.addEventListener('input', () => {
    if (debounceTimer !== null) clearTimeout(debounceTimer);
    const mode = (playBtn.dataset.btaMode as PlayMode) || selectedMode;
    const delay = mode === 'ym2151' ? 1000 : 0;
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      // 再生中（playボタンがdisabled）の間は自動playを抑止し、多重実行を防ぐ
      if (!playBtn.disabled && mode !== 'textarea') {
        playBtn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      }
    }, delay);
  });

  // 投稿ごとのシンセインスタンス
  const abcjsPlayer = new AbcjsPlayer();

  // ---- ドロップダウン開閉 ----
  dropBtn.addEventListener('click', e => {
    e.stopPropagation();
    const isOpen = menu.style.display !== 'none';
    menu.style.display = isOpen ? 'none' : 'block';
    dropBtn.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
  });

  // 投稿ごとのSequencerNodesインスタンス（Tone.jsシーケンサー用）
  const tonejsRef: TonejsRef = { nodes: null };

  playBtn.addEventListener('click', async e => {
    e.stopPropagation();
    const mode = (playBtn.dataset.btaMode as PlayMode) || selectedMode;

    if (mode === 'textarea') {
      if (textarea.style.display === 'none') {
        // 初回のみ投稿テキストをセット（ユーザー編集を保持）
        if (!textareaInitialized && !textarea.value) {
          textarea.value = detectedCleanedText;
        }
        textareaInitialized = true;
        textarea.style.display = 'block';
        showTemplateSelectIfNeeded();
        showWavExportBtnIfNeeded();
      } else {
        textarea.style.display = 'none';
        templateSelect.style.display = 'none';
        wavExportBtn.style.display = 'none';
      }
      return;
    }

    // 未初期化の場合は投稿テキスト（検出行削除済み）をセット
    if (!textareaInitialized && !textarea.value) {
      textarea.value = detectedCleanedText;
    }
    textareaInitialized = true;

    if (mode === 'mmlabc') {
      await playMmlabcMode(textarea.value, abcjsPlayer, scoreDiv, handleError);
      return;
    }

    if (mode === 'chord2mml') {
      await playChord2mmlMode(textarea.value, abcjsPlayer, scoreDiv, handleError);
      return;
    }

    if (mode === 'tonejs') {
      await playToneJsMode(textarea.value, tonejsRef, handleError);
      return;
    }

    if (mode === 'ym2151') {
      playBtn.disabled = true;
      try {
        await playYm2151Mode(textarea.value, handleError);
      } finally {
        playBtn.disabled = false;
      }
      return;
    }

    if (mode === 'mix') {
      playBtn.disabled = true;
      try {
        await playMixModeHandler(textarea.value, handleError);
      } finally {
        playBtn.disabled = false;
      }
      return;
    }

    if (mode === 'voicevox') {
      const text = textarea.value;
      if (!text) return;
      playBtn.disabled = true;
      try {
        await playVoicevoxMode(text, handleError);
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
