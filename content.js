const LOG_PREFIX = '[BTA:content]';

// ---- 処理済み投稿を管理 ----
const processedPosts = new WeakSet();

// ---- 投稿テキストを取得 ----
function getPostText(postEl) {
  const textEl = postEl.querySelector('[data-testid="postText"]');
  if (textEl) return textEl.innerText;
  return postEl.innerText || '';
}

// ---- playボタンを追加 ----
function addPlayButton(postEl) {
  if (processedPosts.has(postEl)) return;
  processedPosts.add(postEl);

  const btn = document.createElement('button');
  btn.type = 'button';
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
  scanPosts();
  let timer = null;
  const observer = new MutationObserver(() => {
    if (timer) return;
    timer = setTimeout(() => {
      timer = null;
      scanPosts();
    }, 200);
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

init();
