// ---- テンプレートプルダウン・WAVエクスポートボタンの表示管理 ----

import { type PlayMode, modeTemplates } from './playModes';
import { exportWavHandler } from '../audio/playModeHandlers';

export interface ModeUiManagerDeps {
  playBtn: HTMLButtonElement;
  templateSelect: HTMLSelectElement;
  wavExportBtn: HTMLButtonElement;
  textarea: HTMLTextAreaElement;
  showErrorToast: (message: string) => void;
  getSelectedMode: () => PlayMode;
}

export interface ModeUiManager {
  showTemplateSelectIfNeeded: () => void;
  showWavExportBtnIfNeeded: () => void;
}

export function createModeUiManager(deps: ModeUiManagerDeps): ModeUiManager {
  const { playBtn, templateSelect, wavExportBtn, textarea, showErrorToast, getSelectedMode } = deps;

  function getMode(): PlayMode {
    return (playBtn.dataset.btaMode as PlayMode) || getSelectedMode();
  }

  function updateTemplateSelect(): void {
    const mode = getMode();
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
    const mode = getMode();
    const templates = modeTemplates[mode] ?? [];
    if (templates.length > 0) {
      updateTemplateSelect();
      templateSelect.style.display = 'inline-block';
    } else {
      templateSelect.style.display = 'none';
    }
  }

  function showWavExportBtnIfNeeded(): void {
    const mode = getMode();
    if (mode === 'ym2151' && textarea.style.display !== 'none') {
      wavExportBtn.style.display = 'inline-block';
    } else {
      wavExportBtn.style.display = 'none';
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

  return { showTemplateSelectIfNeeded, showWavExportBtnIfNeeded };
}
