// ---- お気に入り管理（chrome.storage.localへのCRUD） ----

import { addToHistory } from './historyStorage';

const FAVORITES_KEY = 'bta-favorites';
const FAVORITES_MAX = 20;

export async function loadFavorites(): Promise<string[]> {
  try {
    const result = await chrome.storage.local.get(FAVORITES_KEY);
    const parsed: unknown = result[FAVORITES_KEY];
    if (!Array.isArray(parsed)) return [];
    return (parsed as unknown[])
      .filter((item): item is string => typeof item === 'string')
      .slice(0, FAVORITES_MAX);
  } catch {
    return [];
  }
}

async function saveFavorites(items: string[]): Promise<void> {
  try {
    await chrome.storage.local.set({ [FAVORITES_KEY]: items });
  } catch {
    // chrome.storage.local が使えない環境では無視
  }
}

export async function addToFavorites(text: string): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed) return;
  const items = (await loadFavorites()).filter(item => item !== trimmed);
  items.unshift(trimmed);
  await saveFavorites(items.slice(0, FAVORITES_MAX));
}

export async function removeFromFavorites(text: string): Promise<void> {
  const trimmed = text.trim();
  const items = (await loadFavorites()).filter(item => item !== trimmed);
  await saveFavorites(items);
  // 削除したアイテムをhistoryに追加（うっかりミスをリカバーする用）
  await addToHistory(trimmed);
}
