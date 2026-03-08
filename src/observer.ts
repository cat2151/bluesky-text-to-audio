import { addPlayButton } from './playButton';

// ---- 投稿要素のセレクター（フィード・プロフィール・スレッド共通） ----
const POST_SELECTOR = '[data-testid^="feedItem-"], [data-testid^="postThreadItem-"]';

// ---- ON/OFF状態 ----
let isEnabled = true;

export function setEnabled(enabled: boolean): void {
  isEnabled = enabled;
  document.querySelectorAll<HTMLElement>('[data-bta-wrapper]').forEach(el => {
    el.style.display = enabled ? '' : 'none';
  });
}

// ---- 投稿要素を検出 ----
function findPostElements(): NodeListOf<HTMLElement> {
  return document.querySelectorAll<HTMLElement>(POST_SELECTOR);
}

// ---- playボタンを追加し、無効時は非表示にする ----
function addPlayButtonWithVisibility(postEl: HTMLElement): void {
  addPlayButton(postEl);
  if (!isEnabled) {
    const wrapper = postEl.querySelector<HTMLElement>('[data-bta-wrapper]');
    if (wrapper) wrapper.style.display = 'none';
  }
}

// ---- 全投稿にplayボタンを追加 ----
function scanPosts(): void {
  findPostElements().forEach(postEl => addPlayButtonWithVisibility(postEl));
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
        if (node.matches(POST_SELECTOR)) {
          addPlayButtonWithVisibility(node);
        }

        // 追加されたノード配下に含まれる投稿要素を処理
        if (node.querySelectorAll) {
          node
            .querySelectorAll<HTMLElement>(POST_SELECTOR)
            .forEach(postEl => addPlayButtonWithVisibility(postEl));
        }
      });
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });
}
