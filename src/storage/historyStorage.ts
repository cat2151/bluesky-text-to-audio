// ---- history管理（chrome.storage.localへのCRUD） ----

const HISTORY_KEY = 'bta-history';
const HISTORY_MAX = 20;

export async function loadHistory(): Promise<string[]> {
  try {
    const result = await chrome.storage.local.get(HISTORY_KEY);
    const parsed: unknown = result[HISTORY_KEY];
    if (!Array.isArray(parsed)) return [];
    return (parsed as unknown[])
      .filter((item): item is string => typeof item === 'string')
      .slice(0, HISTORY_MAX);
  } catch {
    return [];
  }
}

async function saveHistory(items: string[]): Promise<void> {
  try {
    await chrome.storage.local.set({ [HISTORY_KEY]: items });
  } catch {
    // chrome.storage.local が使えない環境では無視
  }
}

export async function addToHistory(text: string): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed) return;
  const items = (await loadHistory()).filter(item => item !== trimmed);
  items.unshift(trimmed);
  await saveHistory(items.slice(0, HISTORY_MAX));
}
