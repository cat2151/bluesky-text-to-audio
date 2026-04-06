// ---- 投稿テキストを取得 ----
export function getPostText(postEl: HTMLElement): string {
  // feedItemなどテキスト投稿: [data-testid="postText"] がある場合はそれを優先
  const textEl = postEl.querySelector('[data-testid="postText"]');
  if (textEl instanceof HTMLElement) return textEl.innerText;

  // feedItemの画像のみ投稿など: [data-testid="contentHider-post"] がある場合はその内容を返す
  // (投稿者名はcontentHider-postの外にあるため含まれない)
  const contentEl = postEl.querySelector('[data-testid="contentHider-post"]');
  if (contentEl instanceof HTMLElement) return contentEl.innerText;

  // フォールバック: postThreadItem-* など postText / contentHider-post がない場合
  // 注入したwrapper要素と投稿者情報リンクを除外してテキストを取得
  const clone = postEl.cloneNode(true) as HTMLElement;
  clone.querySelectorAll('[data-bta-wrapper]').forEach(el => el.remove());
  // /profile/ へのリンクでかつ aria-label がある要素を除去する
  // (PostMetaの投稿者名・ハンドルリンク、タイムスタンプリンク(/profile/xx/post/yy形式)、
  //  ThreadItemAnchorの投稿者リンク、リポスト数/いいね数などのエンゲージメントリンクに該当)
  // 投稿テキスト内のメンションは aria-label を持たないため保持される
  clone.querySelectorAll('[href^="/profile/"][aria-label]').forEach(el => el.remove());
  return clone.innerText || '';
}
