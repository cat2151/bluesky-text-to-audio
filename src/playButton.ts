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
  chordPreprocessMixText,
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
  createTextarea2,
  createScoreDiv,
  createWrapper,
  createPortErrorRow,
} from './playButtonDom';
import { addToHistory } from './historyStorage';
import { createHistoryAndFavoritesSection } from './historyAndFavoritesSection';
import { createPortErrorHandlers } from './portErrorHandlers';

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

  // ---- 外側クロージャの可変状態へのセッター（抽出モジュールから変更するために使用） ----
  const setTextareaInitialized = (v: boolean) => { textareaInitialized = v; };
  const setIsPlayingFromHistory = (v: boolean) => { isPlayingFromHistory = v; };

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
  historyHeader.addEventListener('click', e => { e.stopPropagation(); });
  historyHeader.addEventListener('mousedown', e => { e.stopPropagation(); });
  historyContainer.addEventListener('click', e => { e.stopPropagation(); });
  historyContainer.addEventListener('mousedown', e => { e.stopPropagation(); });

  // favoritesContainer上でのマウスイベント（click/mousedown）が親要素に伝播してページ遷移しないようにする
  favoritesHeader.addEventListener('click', e => { e.stopPropagation(); });
  favoritesHeader.addEventListener('mousedown', e => { e.stopPropagation(); });
  favoritesContainer.addEventListener('click', e => { e.stopPropagation(); });
  favoritesContainer.addEventListener('mousedown', e => { e.stopPropagation(); });

  // textarea上でのマウスイベント（click/mousedown）が親要素に伝播してページ遷移しないようにする
  textarea.addEventListener('click', e => { e.stopPropagation(); });
  textarea.addEventListener('mousedown', e => { e.stopPropagation(); });

  // textarea2上でのマウスイベント（click/mousedown）が親要素に伝播してページ遷移しないようにする
  textarea2.addEventListener('click', e => { e.stopPropagation(); });
  textarea2.addEventListener('mousedown', e => { e.stopPropagation(); });

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

  // voicevoxDownloadRow/surgextDownloadRow上でのマウスイベント（click/mousedown）が親要素に伝播してページ遷移しないようにする
  voicevoxDownloadRow.addEventListener('click', e => { e.stopPropagation(); });
  voicevoxDownloadRow.addEventListener('mousedown', e => { e.stopPropagation(); });
  surgextDownloadRow.addEventListener('click', e => { e.stopPropagation(); });
  surgextDownloadRow.addEventListener('mousedown', e => { e.stopPropagation(); });

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

  // ---- エラーハンドラ（ポートエラー検出・表示含む） ----
  const { handleError, handleVoicevoxError, handleSurgextError, handleMixError, clearPortErrorRows } =
    createPortErrorHandlers({
      textarea, voicevoxDownloadRow, surgextDownloadRow,
      showTemplateSelectIfNeeded, showWavExportBtnIfNeeded,
      showErrorToast, setTextareaInitialized,
    });

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

  // textarea2編集デバウンスで自動play（mixモードのMMLを直接演奏、1sec）
  let debounceTimer2: ReturnType<typeof setTimeout> | null = null;
  textarea2.addEventListener('input', () => {
    if (debounceTimer2 !== null) clearTimeout(debounceTimer2);
    debounceTimer2 = setTimeout(async () => {
      debounceTimer2 = null;
      if (playBtn.disabled) return;
      // mixモードかつtextarea2が表示中の場合のみ再生する
      const currentMode = (playBtn.dataset.btaMode as PlayMode) || selectedMode;
      if (currentMode !== 'mix' || textarea2.style.display === 'none') return;
      clearPortErrorRows();
      clearErrorToast();
      playBtn.disabled = true;
      showStatusToast('prerendering...');
      try {
        await playMixModeHandler(textarea2.value, handleMixError, clearStatusToast);
      } finally {
        clearStatusToast();
        playBtn.disabled = false;
      }
    }, 1000);
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
    clearPortErrorRows();

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
        // chord+engineトラックがあれば、chord2mmlで展開したMMLをtextarea2に表示する（textareaの内容は維持する）
        const originalText = textarea.value;
        let playText = originalText;
        try {
          const { preprocessed, changed } = await chordPreprocessMixText(originalText);
          if (changed) {
            textarea2.value = preprocessed;
            textarea2.style.display = 'block';
            playText = preprocessed;
          } else {
            // chord+engineトラックがなくなった場合はtextarea2を非表示・クリアする
            textarea2.style.display = 'none';
            textarea2.value = '';
          }
        } catch (preprocessErr) {
          console.warn(LOG_PREFIX, 'chord preprocessing failed, playing original text:', preprocessErr);
        }
        await playMixModeHandler(playText, handleMixError, clearStatusToast);
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
        await playVoicevoxMode(text, handleVoicevoxError, clearStatusToast);
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
        await playSurgeXtMode(text, handleSurgextError, clearStatusToast);
      } finally {
        clearStatusToast();
        playBtn.disabled = false;
      }
    }
  });

  const wrapper = createWrapper();
  wrapper.append(row, voicevoxDownloadRow, surgextDownloadRow, historyHeader, historyContainer, favoritesHeader, favoritesContainer, textarea, textarea2, scoreDiv);

  postEl.prepend(wrapper);
}
