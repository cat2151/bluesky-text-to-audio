import { addPlayButton } from './playButton';

// ---- 投稿要素を検出 ----
function findPostElements(): NodeListOf<HTMLElement> {
  return document.querySelectorAll<HTMLElement>('[data-testid^="feedItem-"]');
}

// ---- 全投稿にplayボタンを追加 ----
function scanPosts(): void {
  findPostElements().forEach(postEl => addPlayButton(postEl));
}

// ---- MutationObserverで新規投稿を監視 ----
export function init(): void {
  // 既存の投稿を一度だけ全走査
  scanPosts();

  // 以降は MutationObserver の addedNodes から増分処理
  const observer = new MutationObserver(mutationsList => {
    mutationsList.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (!(node instanceof HTMLElement)) return;

        // 追加されたノード自体が投稿要素の場合
        if (node.matches('[data-testid^="feedItem-"]')) {
          addPlayButton(node);
        }

        // 追加されたノード配下に含まれる投稿要素を処理
        if (node.querySelectorAll) {
          node
            .querySelectorAll<HTMLElement>('[data-testid^="feedItem-"]')
            .forEach(postEl => addPlayButton(postEl));
        }
      });
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });
}
