// ---- 投稿テキストを取得 ----
export function getPostText(postEl: HTMLElement): string {
  const textEl = postEl.querySelector('[data-testid="postText"]');
  if (textEl instanceof HTMLElement) return textEl.innerText;
  // フォールバック: 注入したwrapper要素ごと除外してテキストを取得
  const clone = postEl.cloneNode(true) as HTMLElement;
  clone.querySelectorAll('[data-bta-wrapper]').forEach(el => el.remove());
  return clone.innerText || '';
}
