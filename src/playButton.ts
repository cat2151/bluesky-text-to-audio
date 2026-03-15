import { AbcjsPlayer } from './loaders/abcjsPlayer';
import { getPostText } from './postText';
import { detectModeFromText } from './detectModeFromText';
import { type PlayMode, menuItems } from './playModes';
import { createErrorToast, createStatusToast } from './toast';
import { type TonejsRef } from './playModeHandlers';
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
  createTextarea2,
  createScoreDiv,
  createWrapper,
  createPortErrorRow,
} from './playButtonDom';
import { addToHistory } from './historyStorage';
import { createHistoryAndFavoritesSection } from './historyAndFavoritesSection';
import { createPortErrorHandlers } from './portErrorHandlers';
import { createModeUiManager } from './modeUiManager';
import { wireTextareaInputHandlers } from './textareaInputHandlers';
import { wirePlayButtonClickHandler } from './playButtonClickHandler';

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

// ---- click/mousedownの伝播をまとめてブロックするヘルパー ----
function blockPropagation(...elements: HTMLElement[]): void {
  for (const el of elements) {
    el.addEventListener('click', e => { e.stopPropagation(); });
    el.addEventListener('mousedown', e => { e.stopPropagation(); });
  }
}

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
  const textarea2 = createTextarea2();
  const scoreDiv = createScoreDiv();
  const voicevoxDownloadRow = createPortErrorRow(
    'https://cat2151.github.io/voicevox-playground/',
    'VOICEVOXをダウンロード',
    'このChrome拡張は voicevox-playground と同じ技術で、ずんだもん読み上げができます'
  );
  const surgextDownloadRow = createPortErrorRow(
    'https://github.com/cat2151/clap-mml-render-tui/blob/main/README.ja.md',
    'Surge XTのサーバーをダウンロード',
    'このChrome拡張は clap-mml-render-tui のserverモードと接続して、Surge XTを演奏できます'
  );

  // ---- 外側クロージャの可変状態へのアクセサ（抽出モジュールから変更するために使用） ----
  const getTextareaInitialized = () => textareaInitialized;
  const setTextareaInitialized = (v: boolean) => { textareaInitialized = v; };
  const getIsPlayingFromHistory = () => isPlayingFromHistory;
  const setIsPlayingFromHistory = (v: boolean) => { isPlayingFromHistory = v; };
  const getSelectedMode = () => selectedMode;

  // ---- エラートーストを表示する ----
  const { show: showErrorToast, clear: clearErrorToast } = createErrorToast(row);

  // ---- ステータストーストを表示する（再生開始まで表示、再生開始時に消える） ----
  const { show: showStatusToast, clear: clearStatusToast } = createStatusToast(row);

  // ---- テンプレートプルダウン・WAVエクスポートボタンの表示管理 ----
  const { showTemplateSelectIfNeeded, showWavExportBtnIfNeeded } = createModeUiManager({
    playBtn, templateSelect, wavExportBtn, textarea,
    showErrorToast, getSelectedMode,
  });

  // ---- エラーハンドラ（ポートエラー検出・表示含む） ----
  const { handleError, handleVoicevoxError, handleSurgextError, handleMixError, clearPortErrorRows } =
    createPortErrorHandlers({
      textarea, voicevoxDownloadRow, surgextDownloadRow,
      showTemplateSelectIfNeeded, showWavExportBtnIfNeeded,
      showErrorToast, setTextareaInitialized,
    });

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

  // ---- historyセクション・お気に入りセクションのUI状態・イベント管理 ----
  menu.append(createMenuSeparator());
  const {
    historyToggleBtn, historyHeader, historyContainer,
    favoritesToggleBtn, favoritesHeader, favoritesContainer,
  } = createHistoryAndFavoritesSection({
    menu, dropBtn, playBtn, textarea,
    showTemplateSelectIfNeeded,
    showWavExportBtnIfNeeded,
    setTextareaInitialized,
    setIsPlayingFromHistory,
  });
  menu.append(historyToggleBtn, favoritesToggleBtn);

  row.append(playBtn, dropBtn, menu, templateSelect, wavExportBtn);

  // ---- マウスイベントの伝播をまとめてブロック（bsky.appのページ遷移防止） ----
  // wavExportBtnのclick/mousedownはmodeUiManager.ts内で設定済みのため除外
  blockPropagation(
    row, historyHeader, historyContainer,
    favoritesHeader, favoritesContainer,
    textarea, textarea2, templateSelect,
    voicevoxDownloadRow, surgextDownloadRow
  );

  // ---- disabledなplayボタンをクリックしたときのエラートースト ----
  // disabled状態のボタンはclickイベントを発火しないが、pointerdownは発火する
  playBtn.addEventListener('pointerdown', e => {
    if (!playBtn.disabled) return;
    e.stopPropagation();
    showErrorToast('再生処理中です。しばらくお待ちください');
  });

  // ---- ドロップダウン開閉 ----
  dropBtn.addEventListener('click', e => {
    e.stopPropagation();
    const isOpen = menu.style.display !== 'none';
    menu.style.display = isOpen ? 'none' : 'block';
    dropBtn.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
  });

  // 投稿ごとのシンセインスタンス
  const abcjsPlayer = new AbcjsPlayer();

  // 投稿ごとのSequencerNodesインスタンス（Tone.jsシーケンサー用）
  const tonejsRef: TonejsRef = { nodes: null };

  // ---- textarea / textarea2 の入力デバウンス・自動再生ハンドラ ----
  wireTextareaInputHandlers({
    playBtn, textarea, textarea2,
    clearPortErrorRows, clearErrorToast,
    showStatusToast, clearStatusToast,
    handleMixError, getSelectedMode,
  });

  // ---- playボタンのクリックハンドラ ----
  wirePlayButtonClickHandler({
    playBtn, textarea, textarea2, scoreDiv, templateSelect, wavExportBtn,
    abcjsPlayer, tonejsRef, detectedCleanedText,
    getTextareaInitialized, setTextareaInitialized,
    getIsPlayingFromHistory, setIsPlayingFromHistory,
    getSelectedMode,
    handleError, handleVoicevoxError, handleSurgextError, handleMixError,
    clearPortErrorRows, clearErrorToast,
    showStatusToast, clearStatusToast,
    showTemplateSelectIfNeeded, showWavExportBtnIfNeeded,
  });

  const wrapper = createWrapper();
  wrapper.append(row, voicevoxDownloadRow, surgextDownloadRow, historyHeader, historyContainer, favoritesHeader, favoritesContainer, textarea, textarea2, scoreDiv);

  postEl.prepend(wrapper);
}
