import * as ABCJS from 'abcjs';
import { parse as mml2abcParse } from './mml2abc.mjs';

const LOG_PREFIX = '[BTA:content]';

// ---- 処理済み投稿を管理 ----
const processedPosts = new WeakSet<HTMLElement>();

// ---- 投稿テキストを取得 ----
function getPostText(postEl: HTMLElement): string {
  const textEl = postEl.querySelector('[data-testid="postText"]');
  if (textEl instanceof HTMLElement) return textEl.innerText;
  // フォールバック: 注入したwrapper要素ごと除外してテキストを取得
  const clone = postEl.cloneNode(true) as HTMLElement;
  clone.querySelectorAll('[data-bta-wrapper]').forEach(el => el.remove());
  return clone.innerText || '';
}

// ---- playボタン行とtextareaを追加 ----
function addPlayButton(postEl: HTMLElement): void {
  if (processedPosts.has(postEl)) return;
  processedPosts.add(postEl);

  const btnStyle = `
    display: inline-flex;
    align-items: center;
    margin: 4px 4px 4px 4px;
    padding: 4px 10px;
    background: #0085ff;
    color: #fff;
    border: none;
    border-radius: 4px;
    font-size: 13px;
    cursor: pointer;
    z-index: 1;
  `;

  // textareaを開く/閉じるボタン
  const toggleBtn = document.createElement('button');
  toggleBtn.type = 'button';
  toggleBtn.setAttribute('data-bta-play', '');
  toggleBtn.textContent = '▶ textareaを開く';
  toggleBtn.style.cssText = btnStyle;

  // mmlabcでplayボタン
  const mmlabcBtn = document.createElement('button');
  mmlabcBtn.type = 'button';
  mmlabcBtn.setAttribute('data-bta-mmlabc', '');
  mmlabcBtn.textContent = '🎵 mmlabcでplay';
  mmlabcBtn.style.cssText = btnStyle;

  // abcjs playボタン
  const playBtn = document.createElement('button');
  playBtn.type = 'button';
  playBtn.setAttribute('data-bta-abcplay', '');
  playBtn.textContent = '▶ Play';
  playBtn.style.cssText = btnStyle;

  // ボタン行コンテナ
  const row = document.createElement('div');
  row.setAttribute('data-bta-row', '');
  row.style.cssText = `
    display: flex;
    align-items: center;
    margin: 4px 0;
  `;
  row.append(toggleBtn, mmlabcBtn, playBtn);

  // textarea
  const textarea = document.createElement('textarea');
  textarea.setAttribute('data-bta-textarea', '');
  textarea.style.cssText = `
    display: none;
    width: 100%;
    box-sizing: border-box;
    margin: 4px 0;
    padding: 6px 8px;
    font-size: 13px;
    border: 1px solid #0085ff;
    border-radius: 4px;
    resize: vertical;
    min-height: 80px;
  `;

  // abcjs SVG表示用div
  const scoreDiv = document.createElement('div');
  scoreDiv.setAttribute('data-bta-score', '');
  scoreDiv.style.cssText = `
    display: none;
    background: white;
    color: black;
    border: 1px solid #ccc;
    border-radius: 4px;
    padding: 4px;
    margin: 4px 0;
  `;

  // textarea上でのポインタイベント（click/mousedown）が親要素に伝播してページ遷移しないようにする
  textarea.addEventListener('click', e => { e.stopPropagation(); });
  textarea.addEventListener('mousedown', e => { e.stopPropagation(); });

  // 投稿ごとのシンセインスタンス
  let synthInstance: ABCJS.MidiBuffer | null = null;

  // ---- ABCテキストを五線譜表示し演奏する共通ヘルパー ----
  function renderAndPlay(abcText: string): void {
    scoreDiv.style.display = 'block';
    const tuneObjects = ABCJS.renderAbc(scoreDiv, abcText);
    const visualObj = tuneObjects[0];
    if (!visualObj) return;

    if (ABCJS.synth.supportsAudio()) {
      if (!synthInstance) {
        synthInstance = new ABCJS.synth.CreateSynth();
      } else {
        // 既存のシンセが再生中の場合は、再初期化前に必ず停止する
        synthInstance.stop();
      }
      synthInstance
        .init({ visualObj, options: {} })
        .then(() => synthInstance!.prime())
        .then(() => {
          // 再生開始（easyabcjs6と同様に stop() してから start() する）
          synthInstance!.stop();
          synthInstance!.start();
        })
        .catch((error: unknown) => {
          console.warn(LOG_PREFIX, 'Audio problem:', error);
        });
    } else {
      console.error(LOG_PREFIX, 'Audio is not supported in this browser.');
    }
  }

  toggleBtn.addEventListener('click', e => {
    e.stopPropagation();
    if (textarea.style.display === 'none') {
      // 初回のみ投稿テキストをセット（ユーザー編集を保持）
      if (!textarea.value) {
        textarea.value = getPostText(postEl);
      }
      textarea.style.display = 'block';
    } else {
      textarea.style.display = 'none';
    }
  });

  mmlabcBtn.addEventListener('click', e => {
    e.stopPropagation();
    // 未初期化の場合は投稿テキストをセット
    if (!textarea.value) {
      textarea.value = getPostText(postEl);
    }
    const mml = textarea.value;
    let abcText = '';
    try {
      abcText = mml2abcParse(mml);
    } catch (error) {
      console.error(LOG_PREFIX, 'MML parse error:', error);
      return;
    }
    renderAndPlay(abcText);
  });

  playBtn.addEventListener('click', e => {
    e.stopPropagation();
    // 未初期化の場合は投稿テキストをセット
    if (!textarea.value) {
      textarea.value = getPostText(postEl);
    }
    renderAndPlay(textarea.value);
  });

  const wrapper = document.createElement('div');
  wrapper.setAttribute('data-bta-wrapper', '');
  wrapper.append(row, textarea, scoreDiv);

  postEl.prepend(wrapper);
}

// ---- 投稿要素を検出 ----
function findPostElements(): NodeListOf<HTMLElement> {
  return document.querySelectorAll<HTMLElement>('[data-testid^="feedItem-"]');
}

// ---- 全投稿にplayボタンを追加 ----
function scanPosts(): void {
  findPostElements().forEach(postEl => addPlayButton(postEl));
}

// ---- MutationObserverで新規投稿を監視 ----
function init(): void {
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

init();
