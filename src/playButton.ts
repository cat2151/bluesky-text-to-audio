import { AbcjsPlayer } from './loaders/abcjsPlayer';
import { getPostText } from './postText';
import { detectModeFromText } from './detectModeFromText';
import { type PlayMode, menuItems, modeTemplates } from './playModes';
import { createErrorToast, createStatusToast } from './toast';
import {
  type TonejsRef,
  playMmlabcMode,
  playChord2mmlMode,
  playToneJsMode,
  playYm2151Mode,
  playMixMode as playMixModeHandler,
  playVoicevoxMode,
  playSurgeXtMode,
  exportWavHandler,
} from './playModeHandlers';
import {
  createPlayBtn,
  createDropBtn,
  createMenu,
  createMenuItem,
  createMenuSeparator,
  createResetMenuItem,
  createRow,
  createTemplateSelect,
  createWavExportBtn,
  createTextarea,
  createScoreDiv,
  createWrapper,
} from './playButtonDom';
import {
  createHistoryToggleMenuItem,
  createHistoryContainer,
  createHistoryItem,
} from './historyDom';
import {
  createFavoritesToggleMenuItem,
  createFavoritesContainer,
  createFavoritesItem,
  createFavoritesExportImportBar,
} from './favoritesDom';
import { addToHistory, loadHistory } from './historyStorage';
import { addToFavorites, loadFavorites, removeFromFavorites, exportFavoritesAsJson, importFavoritesFromJson } from './favoritesStorage';

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

  // historyからのplay中はhistoryを更新しない（お気に入りからのplayも同様）
  let isPlayingFromHistory = false;

  // ---- DOM要素を生成 ----
  const initialPlayLabel = menuItems.find(m => m.mode === detectedMode)?.label ?? '再生';
  const playBtn = createPlayBtn(detectedMode, initialPlayLabel);
  const dropBtn = createDropBtn();
  const menu = createMenu();
  const row = createRow();
  const templateSelect = createTemplateSelect();
  const wavExportBtn = createWavExportBtn();
  const textarea = createTextarea();
  const scoreDiv = createScoreDiv();
  const historyToggleBtn = createHistoryToggleMenuItem();
  const historyContainer = createHistoryContainer();
  let historyOpen = false;
  const favoritesToggleBtn = createFavoritesToggleMenuItem();
  const favoritesContainer = createFavoritesContainer();
  let favoritesOpen = false;

  const favoritesExportImportBar = createFavoritesExportImportBar(
    async () => {
      try {
        const json = await exportFavoritesAsJson();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'bta-favorites.json';
        a.click();
        setTimeout(() => { URL.revokeObjectURL(url); }, 0);
      } catch (err) {
        console.error(LOG_PREFIX, 'お気に入りexport失敗', err);
      }
    },
    () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json,application/json';
      input.addEventListener('change', async () => {
        const file = input.files?.[0];
        if (!file) return;
        try {
          const text = await file.text();
          await importFavoritesFromJson(text);
          if (favoritesOpen) {
            void renderFavorites();
          }
        } catch (err) {
          console.error(LOG_PREFIX, 'お気に入りimport失敗', err);
        }
      });
      input.click();
    }
  );

  // ---- メニュー項目を追加（クリックハンドラを設定） ----
  for (const item of menuItems) {
    const menuItem = createMenuItem(item.mode, item.label);
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
  menu.append(createMenuSeparator());
  const resetBtn = createResetMenuItem();
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

  // ---- historyトグル＆historyアイテムリスト ----
  menu.append(createMenuSeparator());

  async function renderHistory(): Promise<void> {
    historyContainer.innerHTML = '';
    const items = await loadHistory();
    if (items.length === 0) {
      const empty = document.createElement('div');
      empty.textContent = '履歴なし';
      empty.style.cssText = 'padding: 8px 14px; font-size: 12px; color: #999;';
      historyContainer.append(empty);
      historyContainer.append(favoritesExportImportBar);
      return;
    }
    for (const text of items) {
      const historyItem = createHistoryItem(text, () => {
        if (playBtn.disabled) return;
        isPlayingFromHistory = true;
        textarea.value = text;
        textareaInitialized = true;
        textarea.style.display = 'block';
        showTemplateSelectIfNeeded();
        showWavExportBtnIfNeeded();
        menu.style.display = 'none';
        dropBtn.setAttribute('aria-expanded', 'false');
        playBtn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      }, async () => {
        await addToFavorites(text);
        void renderHistory();
        if (favoritesOpen) {
          void renderFavorites();
        }
      });
      historyContainer.append(historyItem);
    }
    historyContainer.append(favoritesExportImportBar);
  }

  historyToggleBtn.addEventListener('click', e => {
    e.stopPropagation();
    historyOpen = !historyOpen;
    menu.style.display = 'none';
    dropBtn.setAttribute('aria-expanded', 'false');
    if (historyOpen) {
      historyToggleBtn.textContent = '📖 historyを閉じる';
      void renderHistory().then(() => {
        historyContainer.style.display = 'block';
      });
    } else {
      historyToggleBtn.textContent = '📖 historyを開く';
      historyContainer.style.display = 'none';
    }
  });

  menu.append(historyToggleBtn);

  // ---- お気に入りトグル＆お気に入りアイテムリスト ----
  async function renderFavorites(): Promise<void> {
    favoritesContainer.innerHTML = '';
    const items = await loadFavorites();
    if (items.length === 0) {
      const empty = document.createElement('div');
      empty.textContent = 'お気に入りなし';
      empty.style.cssText = 'padding: 8px 14px; font-size: 12px; color: #999;';
      favoritesContainer.append(empty);
      return;
    }
    for (const text of items) {
      const favoriteItem = createFavoritesItem(text, () => {
        if (playBtn.disabled) return;
        isPlayingFromHistory = true;
        textarea.value = text;
        textareaInitialized = true;
        textarea.style.display = 'block';
        showTemplateSelectIfNeeded();
        showWavExportBtnIfNeeded();
        playBtn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      }, async () => {
        await removeFromFavorites(text);
        void renderFavorites();
        if (historyOpen) {
          void renderHistory();
        }
      });
      favoritesContainer.append(favoriteItem);
    }
  }

  favoritesToggleBtn.addEventListener('click', e => {
    e.stopPropagation();
    favoritesOpen = !favoritesOpen;
    menu.style.display = 'none';
    dropBtn.setAttribute('aria-expanded', 'false');
    if (favoritesOpen) {
      favoritesToggleBtn.textContent = '★ お気に入りを閉じる';
      void renderFavorites().then(() => {
        if (favoritesOpen) {
          favoritesContainer.style.display = 'block';
        }
      });
    } else {
      favoritesToggleBtn.textContent = '★ お気に入りを開く';
      favoritesContainer.style.display = 'none';
    }
  });

  menu.append(favoritesToggleBtn);

  row.append(playBtn, dropBtn, menu, templateSelect, wavExportBtn);

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
  function showWavExportBtnIfNeeded(): void {
    const mode = (playBtn.dataset.btaMode as PlayMode) || selectedMode;
    if (mode === 'ym2151' && textarea.style.display !== 'none') {
      wavExportBtn.style.display = 'inline-block';
    } else {
      wavExportBtn.style.display = 'none';
    }
  }

  // row上でのマウスイベント（click/mousedown）が親要素に伝播してページ遷移しないようにする
  row.addEventListener('click', e => { e.stopPropagation(); });
  row.addEventListener('mousedown', e => { e.stopPropagation(); });

  // historyContainer上でのマウスイベント（click/mousedown）が親要素に伝播してページ遷移しないようにする
  historyContainer.addEventListener('click', e => { e.stopPropagation(); });
  historyContainer.addEventListener('mousedown', e => { e.stopPropagation(); });

  // favoritesContainer上でのマウスイベント（click/mousedown）が親要素に伝播してページ遷移しないようにする
  favoritesContainer.addEventListener('click', e => { e.stopPropagation(); });
  favoritesContainer.addEventListener('mousedown', e => { e.stopPropagation(); });

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
  const { show: showErrorToast, clear: clearErrorToast } = createErrorToast(row);

  // ---- ステータストーストを表示する（再生開始まで表示、再生開始時に消える） ----
  const { show: showStatusToast, clear: clearStatusToast } = createStatusToast(row);

  // ---- disabledなplayボタンをクリックしたときのエラートースト ----
  // disabled状態のボタンはclickイベントを発火しないが、pointerdownは発火する
  playBtn.addEventListener('pointerdown', e => {
    if (!playBtn.disabled) return;
    e.stopPropagation();
    showErrorToast('再生処理中です。しばらくお待ちください');
  });

  // ---- エラー時にtextareaを表示してトーストを出す ----
  function handleError(logLabel: string, message: string, error: unknown): void {
    console.error(LOG_PREFIX, logLabel, error);
    textareaInitialized = true;
    textarea.style.display = 'block';
    showTemplateSelectIfNeeded();
    showWavExportBtnIfNeeded();
    showErrorToast(message);
  }

  // textarea編集デバウンスで自動play（ym2151/mixはレンダリング中にキーボード入力が止まるため1sec、それ以外は0）
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  textarea.addEventListener('input', () => {
    if (debounceTimer !== null) clearTimeout(debounceTimer);
    const modeAtInput = (playBtn.dataset.btaMode as PlayMode) || selectedMode;
    const delay = (modeAtInput === 'ym2151' || modeAtInput === 'mix') ? 1000 : 0;
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      const currentMode = (playBtn.dataset.btaMode as PlayMode) || selectedMode;
      // 再生中（playボタンがdisabled）の間は自動playを抑止し、多重実行を防ぐ
      if (!playBtn.disabled && currentMode !== 'textarea') {
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

    // historyからのplayでなければhistoryに追記する
    const fromHistory = isPlayingFromHistory;
    isPlayingFromHistory = false;
    if (!fromHistory && textarea.value.trim()) {
      await addToHistory(textarea.value);
    }

    if (mode === 'mmlabc') {
      clearErrorToast();
      await playMmlabcMode(textarea.value, abcjsPlayer, scoreDiv, handleError);
      return;
    }

    if (mode === 'chord2mml') {
      clearErrorToast();
      await playChord2mmlMode(textarea.value, abcjsPlayer, scoreDiv, handleError);
      return;
    }

    // mmlabc/chord2mml以外のモードでは五線譜を非表示にする
    scoreDiv.style.display = 'none';

    if (mode === 'tonejs') {
      clearErrorToast();
      await playToneJsMode(textarea.value, tonejsRef, handleError);
      return;
    }

    if (mode === 'ym2151') {
      clearErrorToast();
      playBtn.disabled = true;
      showStatusToast('prerendering...');
      try {
        await playYm2151Mode(textarea.value, handleError, clearStatusToast);
      } finally {
        clearStatusToast();
        playBtn.disabled = false;
      }
      return;
    }

    if (mode === 'mix') {
      clearErrorToast();
      playBtn.disabled = true;
      showStatusToast('prerendering...');
      try {
        await playMixModeHandler(textarea.value, handleError, clearStatusToast);
      } finally {
        clearStatusToast();
        playBtn.disabled = false;
      }
      return;
    }

    if (mode === 'voicevox') {
      const text = textarea.value;
      if (!text) return;
      clearErrorToast();
      playBtn.disabled = true;
      showStatusToast('fetching...');
      try {
        await playVoicevoxMode(text, handleError, clearStatusToast);
      } finally {
        clearStatusToast();
        playBtn.disabled = false;
      }
    }

    if (mode === 'surgext') {
      const text = textarea.value;
      if (!text) return;
      clearErrorToast();
      playBtn.disabled = true;
      showStatusToast('prerendering...');
      try {
        await playSurgeXtMode(text, handleError, clearStatusToast);
      } finally {
        clearStatusToast();
        playBtn.disabled = false;
      }
    }
  });

  const wrapper = createWrapper();
  wrapper.append(row, historyContainer, favoritesContainer, textarea, scoreDiv);

  postEl.prepend(wrapper);
}
