// ---- history / お気に入り セクションのUI状態・イベント管理 ----

import {
  createHistoryToggleMenuItem,
  createHistoryContainer,
  createHistoryItem,
  createHistoryCollapseHeader,
} from './historyDom';
import {
  createFavoritesToggleMenuItem,
  createFavoritesContainer,
  createFavoritesItem,
  createFavoritesExportImportBar,
  createFavoritesCollapseHeader,
} from './favoritesDom';
import { loadHistory } from './historyStorage';
import {
  addToFavorites,
  loadFavorites,
  removeFromFavorites,
  exportFavoritesAsJson,
  importFavoritesFromJson,
} from './favoritesStorage';

const LOG_PREFIX = '[BTA:historyAndFavorites]';

export interface HistoryAndFavoritesSectionDeps {
  menu: HTMLElement;
  dropBtn: HTMLButtonElement;
  playBtn: HTMLButtonElement;
  textarea: HTMLTextAreaElement;
  showTemplateSelectIfNeeded: () => void;
  showWavExportBtnIfNeeded: () => void;
  setTextareaInitialized: (v: boolean) => void;
  setIsPlayingFromHistory: (v: boolean) => void;
}

export interface HistoryAndFavoritesSectionResult {
  historyToggleBtn: HTMLElement;
  historyHeader: HTMLElement;
  historyContainer: HTMLElement;
  favoritesToggleBtn: HTMLElement;
  favoritesHeader: HTMLElement;
  favoritesContainer: HTMLElement;
}

export function createHistoryAndFavoritesSection(
  deps: HistoryAndFavoritesSectionDeps
): HistoryAndFavoritesSectionResult {
  const {
    menu, dropBtn, playBtn, textarea,
    showTemplateSelectIfNeeded, showWavExportBtnIfNeeded,
    setTextareaInitialized, setIsPlayingFromHistory,
  } = deps;

  const historyToggleBtn = createHistoryToggleMenuItem();
  const historyHeader = createHistoryCollapseHeader();
  const historyCollapseBtn = historyHeader.querySelector<HTMLButtonElement>('[data-bta-history-collapse-btn]')!;
  const historyContainer = createHistoryContainer();
  let historyOpen = false;

  const favoritesToggleBtn = createFavoritesToggleMenuItem();
  const favoritesHeader = createFavoritesCollapseHeader();
  const favoritesCollapseBtn = favoritesHeader.querySelector<HTMLButtonElement>('[data-bta-favorites-collapse-btn]')!;
  const favoritesContainer = createFavoritesContainer();
  let favoritesOpen = false;

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
        setIsPlayingFromHistory(true);
        textarea.value = text;
        setTextareaInitialized(true);
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

  function showFavoritesSection(): void {
    favoritesOpen = true;
    favoritesHeader.style.display = 'block';
    favoritesHeader.style.borderRadius = '4px 4px 0 0';
    favoritesCollapseBtn.textContent = '▼ ★ お気に入り';
    favoritesCollapseBtn.setAttribute('aria-expanded', 'true');
    favoritesContainer.style.display = 'block';
    favoritesContainer.style.borderTop = 'none';
    favoritesContainer.style.borderRadius = '0 0 4px 4px';
  }

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
        setIsPlayingFromHistory(true);
        textarea.value = text;
        setTextareaInitialized(true);
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

  function showHistorySection(): void {
    historyOpen = true;
    historyHeader.style.display = 'block';
    historyHeader.style.borderRadius = '4px 4px 0 0';
    historyCollapseBtn.textContent = '▼ 📖 history';
    historyCollapseBtn.setAttribute('aria-expanded', 'true');
    historyContainer.style.display = 'block';
    historyContainer.style.borderTop = 'none';
    historyContainer.style.borderRadius = '0 0 4px 4px';
  }

  historyToggleBtn.addEventListener('click', e => {
    e.stopPropagation();
    menu.style.display = 'none';
    dropBtn.setAttribute('aria-expanded', 'false');
    void renderHistory().then(() => { showHistorySection(); });
  });

  historyCollapseBtn.addEventListener('click', e => {
    e.stopPropagation();
    historyOpen = !historyOpen;
    if (historyOpen) {
      void renderHistory().then(() => { showHistorySection(); });
    } else {
      historyCollapseBtn.textContent = '▶ 📖 history';
      historyCollapseBtn.setAttribute('aria-expanded', 'false');
      historyContainer.style.display = 'none';
      historyHeader.style.borderRadius = '4px';
    }
  });

  favoritesToggleBtn.addEventListener('click', e => {
    e.stopPropagation();
    menu.style.display = 'none';
    dropBtn.setAttribute('aria-expanded', 'false');
    void renderFavorites().then(() => { showFavoritesSection(); });
  });

  favoritesCollapseBtn.addEventListener('click', e => {
    e.stopPropagation();
    favoritesOpen = !favoritesOpen;
    if (favoritesOpen) {
      void renderFavorites().then(() => { showFavoritesSection(); });
    } else {
      favoritesCollapseBtn.textContent = '▶ ★ お気に入り';
      favoritesCollapseBtn.setAttribute('aria-expanded', 'false');
      favoritesContainer.style.display = 'none';
      favoritesHeader.style.borderRadius = '4px';
    }
  });

  return {
    historyToggleBtn,
    historyHeader,
    historyContainer,
    favoritesToggleBtn,
    favoritesHeader,
    favoritesContainer,
  };
}
