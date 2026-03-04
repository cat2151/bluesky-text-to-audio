const LOG_PREFIX = '[BTA:content]';

// ---- 処理済み投稿を管理 ----
const processedPosts = new WeakSet();

// ---- 投稿テキストを取得 ----
function getPostText(postEl) {
  const textEl = postEl.querySelector('[data-testid="postText"]');
  if (textEl) return textEl.innerText;
  // フォールバック: 注入したplayボタンを除外してテキストを取得
  const clone = postEl.cloneNode(true);
  clone.querySelectorAll('[data-bta-play]').forEach(el => el.remove());
  return clone.innerText || '';
}

// ---- playボタンを追加 ----
function addPlayButton(postEl) {
  if (processedPosts.has(postEl)) return;
  processedPosts.add(postEl);

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.setAttribute('data-bta-play', '');
  btn.textContent = '▶ play';
  btn.style.cssText = `
    display: inline-flex;
    align-items: center;
    margin: 4px 8px 4px 8px;
    padding: 4px 10px;
    background: #0085ff;
    color: #fff;
    border: none;
    border-radius: 4px;
    font-size: 13px;
    cursor: pointer;
    z-index: 1;
  `;
  btn.addEventListener('click', e => {
    e.stopPropagation();
    const text = getPostText(postEl);
    console.log(LOG_PREFIX, text);
  });

  postEl.prepend(btn);
}

// ---- 投稿要素を検出 ----
function findPostElements() {
  return document.querySelectorAll('[data-testid^="feedItem-"]');
}

// ---- 全投稿にplayボタンを追加 ----
function scanPosts() {
  findPostElements().forEach(postEl => addPlayButton(postEl));
}

// ---- MutationObserverで新規投稿を監視 ----
function init() {
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
            .querySelectorAll('[data-testid^="feedItem-"]')
            .forEach(postEl => addPlayButton(postEl));
        }
      });
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

init();
