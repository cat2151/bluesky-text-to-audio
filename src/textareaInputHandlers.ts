// ---- textarea / textarea2 の入力デバウンス・自動再生ハンドラ ----

import { type PlayMode } from './playModes';
import { playMixMode as playMixModeHandler } from './playModeHandlers';

type ErrorHandler = (logLabel: string, message: string, error: unknown) => void;

export interface TextareaInputHandlersDeps {
  playBtn: HTMLButtonElement;
  textarea: HTMLTextAreaElement;
  textarea2: HTMLTextAreaElement;
  clearPortErrorRows: () => void;
  clearErrorToast: () => void;
  showStatusToast: (message: string) => void;
  clearStatusToast: () => void;
  handleMixError: ErrorHandler;
  getSelectedMode: () => PlayMode;
}

export function wireTextareaInputHandlers(deps: TextareaInputHandlersDeps): void {
  const {
    playBtn, textarea, textarea2,
    clearPortErrorRows, clearErrorToast,
    showStatusToast, clearStatusToast,
    handleMixError, getSelectedMode,
  } = deps;

  function getMode(): PlayMode {
    return (playBtn.dataset.btaMode as PlayMode) || getSelectedMode();
  }

  // textarea編集デバウンスで自動play（ym2151/mixはレンダリング中にキーボード入力が止まるため1sec、それ以外は0）
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  // SHIFT+ENTER / CTRL+ENTER でplayボタンと同じ挙動をする
  textarea.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Enter' && (e.shiftKey || e.ctrlKey)) {
      e.preventDefault();
      // 保留中のdebounceTimerをキャンセルして二重再生を防ぐ
      if (debounceTimer !== null) { clearTimeout(debounceTimer); debounceTimer = null; }
      if (!playBtn.disabled) {
        playBtn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      }
    }
  });

  textarea.addEventListener('input', () => {
    if (debounceTimer !== null) clearTimeout(debounceTimer);
    const modeAtInput = getMode();
    const delay = (modeAtInput === 'ym2151' || modeAtInput === 'mix') ? 1000 : 0;
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      const currentMode = getMode();
      // 再生中（playボタンがdisabled）の間は自動playを抑止し、多重実行を防ぐ
      if (!playBtn.disabled && currentMode !== 'textarea') {
        playBtn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      }
    }, delay);
  });

  // textarea2のmixモードMML直接演奏ロジック（keydownとdebounceで共有）
  let debounceTimer2: ReturnType<typeof setTimeout> | null = null;

  async function playTextarea2MixIfVisible(): Promise<void> {
    if (playBtn.disabled) return;
    const currentMode = getMode();
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
  }

  // textarea2のSHIFT+ENTER / CTRL+ENTER でplayボタンと同じ挙動をする（mixモードのMMLを直接即時演奏）
  textarea2.addEventListener('keydown', async (e: KeyboardEvent) => {
    if (e.key === 'Enter' && (e.shiftKey || e.ctrlKey)) {
      e.preventDefault();
      // 保留中のdebounceTimer2をキャンセルして二重再生を防ぐ
      if (debounceTimer2 !== null) { clearTimeout(debounceTimer2); debounceTimer2 = null; }
      await playTextarea2MixIfVisible();
    }
  });

  // textarea2編集デバウンスで自動play（mixモードのMMLを直接演奏、1sec）
  textarea2.addEventListener('input', () => {
    if (debounceTimer2 !== null) clearTimeout(debounceTimer2);
    debounceTimer2 = setTimeout(async () => {
      debounceTimer2 = null;
      await playTextarea2MixIfVisible();
    }, 1000);
  });
}
