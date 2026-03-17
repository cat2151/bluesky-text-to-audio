// ---- playボタンのクリックハンドラ ----

import { AbcjsPlayer } from './loaders/abcjsPlayer';
import { type PlayMode } from './playModes';
import { addToHistory } from './historyStorage';
import {
  type TonejsRef,
  playMmlabcMode,
  playChord2mmlMode,
  playToneJsMode,
  playYm2151Mode,
  playMixMode as playMixModeHandler,
  playVoicevoxMode,
  playSurgeXtMode,
  chordPreprocessMixText,
} from './playModeHandlers';

const LOG_PREFIX = '[BTA:playButtonClickHandler]';

type ErrorHandler = (logLabel: string, message: string, error: unknown) => void;

export interface PlayButtonClickHandlerDeps {
  playBtn: HTMLButtonElement;
  textarea: HTMLTextAreaElement;
  textarea2: HTMLTextAreaElement;
  scoreDiv: HTMLElement;
  templateSelect: HTMLSelectElement;
  wavExportBtn: HTMLButtonElement;
  abcjsPlayer: AbcjsPlayer;
  tonejsRef: TonejsRef;
  detectedCleanedText: string;
  getTextareaInitialized: () => boolean;
  setTextareaInitialized: (v: boolean) => void;
  getIsPlayingFromHistory: () => boolean;
  setIsPlayingFromHistory: (v: boolean) => void;
  getSelectedMode: () => PlayMode;
  getPendingPlay: () => boolean;
  setPendingPlay: (v: boolean) => void;
  handleError: ErrorHandler;
  handleVoicevoxError: ErrorHandler;
  handleSurgextError: ErrorHandler;
  handleMixError: ErrorHandler;
  clearPortErrorRows: () => void;
  clearErrorToast: () => void;
  showStatusToast: (message: string) => void;
  clearStatusToast: () => void;
  showTemplateSelectIfNeeded: () => void;
  showWavExportBtnIfNeeded: () => void;
}

export function wirePlayButtonClickHandler(deps: PlayButtonClickHandlerDeps): void {
  const {
    playBtn, textarea, textarea2, scoreDiv, templateSelect, wavExportBtn,
    abcjsPlayer, tonejsRef, detectedCleanedText,
    getTextareaInitialized, setTextareaInitialized,
    getIsPlayingFromHistory, setIsPlayingFromHistory,
    getSelectedMode,
    getPendingPlay, setPendingPlay,
    handleError, handleVoicevoxError, handleSurgextError, handleMixError,
    clearPortErrorRows, clearErrorToast,
    showStatusToast, clearStatusToast,
    showTemplateSelectIfNeeded, showWavExportBtnIfNeeded,
  } = deps;

  function getMode(): PlayMode {
    return (playBtn.dataset.btaMode as PlayMode) || getSelectedMode();
  }

  function triggerPendingPlayIfNeeded(): void {
    if (getPendingPlay()) {
      setPendingPlay(false);
      playBtn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    }
  }

  playBtn.addEventListener('click', async e => {
    e.stopPropagation();
    const mode = getMode();
    clearPortErrorRows();

    if (mode === 'textarea') {
      if (textarea.style.display === 'none') {
        // 初回のみ投稿テキストをセット（ユーザー編集を保持）
        if (!getTextareaInitialized() && !textarea.value) {
          textarea.value = detectedCleanedText;
        }
        setTextareaInitialized(true);
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
    if (!getTextareaInitialized() && !textarea.value) {
      textarea.value = detectedCleanedText;
    }
    setTextareaInitialized(true);

    // historyからのplayでなければhistoryに追記する
    const fromHistory = getIsPlayingFromHistory();
    setIsPlayingFromHistory(false);
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
        triggerPendingPlayIfNeeded();
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
        triggerPendingPlayIfNeeded();
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
        triggerPendingPlayIfNeeded();
      }
      return;
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
        triggerPendingPlayIfNeeded();
      }
    }
  });
}
