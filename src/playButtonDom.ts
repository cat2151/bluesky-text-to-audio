import { type PlayMode } from './playModes';

// ---- DOM要素のファクトリ関数 ----
// 各UI要素のスタイルと属性を定義する責務を担う（ビジネスロジックのイベントハンドラはplayButton.tsが担う）

/** ホバー時に背景色を変えるだけの純粋な見た目効果をボタンに付加するヘルパー */
function addHoverHighlight(btn: HTMLButtonElement): void {
  btn.addEventListener('mouseenter', () => { btn.style.background = '#e8f0fe'; });
  btn.addEventListener('mouseleave', () => { btn.style.background = 'none'; });
}

/** playボタン（SVG三角）を生成する */
export function createPlayBtn(detectedMode: PlayMode, label: string): HTMLButtonElement {
  const playBtn = document.createElement('button');
  playBtn.type = 'button';
  playBtn.setAttribute('data-bta-play', '');
  playBtn.style.cssText = `
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    padding: 0;
    background: #0085ff;
    color: #fff;
    border: none;
    border-radius: 4px 0 0 0;
    cursor: pointer;
    z-index: 1;
    flex-shrink: 0;
  `;
  playBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 16 16" fill="white" xmlns="http://www.w3.org/2000/svg"><polygon points="4,2 14,8 4,14"/></svg>`;
  playBtn.title = label;
  playBtn.setAttribute('aria-label', label);
  playBtn.dataset.btaMode = detectedMode;
  return playBtn;
}

/** ドロップダウン矢印ボタンを生成する */
export function createDropBtn(): HTMLButtonElement {
  const dropBtn = document.createElement('button');
  dropBtn.type = 'button';
  dropBtn.setAttribute('data-bta-drop', '');
  dropBtn.style.cssText = `
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 32px;
    padding: 0;
    background: #0085ff;
    color: #fff;
    border: none;
    border-left: 1px solid rgba(255,255,255,0.3);
    border-radius: 0 4px 0 0;
    cursor: pointer;
    z-index: 1;
    flex-shrink: 0;
  `;
  dropBtn.innerHTML = `<svg width="10" height="10" viewBox="0 0 10 10" fill="white" xmlns="http://www.w3.org/2000/svg"><polygon points="1,3 9,3 5,8"/></svg>`;
  dropBtn.title = 'メニューを開く';
  dropBtn.setAttribute('aria-label', 'メニューを開く');
  dropBtn.setAttribute('aria-haspopup', 'menu');
  dropBtn.setAttribute('aria-expanded', 'false');
  return dropBtn;
}

/** ポップアップメニューコンテナを生成する */
export function createMenu(): HTMLDivElement {
  const menu = document.createElement('div');
  menu.setAttribute('data-bta-menu', '');
  menu.style.cssText = `
    display: none;
    position: absolute;
    top: 100%;
    left: 0;
    background: #fff;
    border: 1px solid #ccc;
    border-radius: 4px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 9999;
    min-width: 180px;
    padding: 4px 0;
  `;
  return menu;
}

/** メニュー項目ボタンを生成する（ホバー効果付き、クリックハンドラは呼び出し元が設定する） */
export function createMenuItem(mode: string, label: string): HTMLButtonElement {
  const menuItem = document.createElement('button');
  menuItem.type = 'button';
  menuItem.setAttribute('data-bta-menu-item', mode);
  menuItem.textContent = label;
  menuItem.style.cssText = `
    display: block;
    width: 100%;
    padding: 8px 14px;
    background: none;
    border: none;
    text-align: left;
    font-size: 13px;
    cursor: pointer;
    color: #000;
    white-space: nowrap;
  `;
  addHoverHighlight(menuItem);
  return menuItem;
}

/** メニュー区切り線を生成する */
export function createMenuSeparator(): HTMLHRElement {
  const separator = document.createElement('hr');
  separator.style.cssText = `
    margin: 4px 0;
    border: none;
    border-top: 1px solid #e0e0e0;
  `;
  return separator;
}

/** リセットメニュー項目ボタンを生成する（ホバー効果付き、クリックハンドラは呼び出し元が設定する） */
export function createResetMenuItem(): HTMLButtonElement {
  const resetBtn = document.createElement('button');
  resetBtn.type = 'button';
  resetBtn.setAttribute('data-bta-menu-item', 'reset');
  resetBtn.textContent = '🔄 リセット';
  resetBtn.style.cssText = `
    display: block;
    width: 100%;
    padding: 8px 14px;
    background: none;
    border: none;
    text-align: left;
    font-size: 13px;
    cursor: pointer;
    color: #000;
    white-space: nowrap;
  `;
  addHoverHighlight(resetBtn);
  return resetBtn;
}

/** ボタン行コンテナを生成する */
export function createRow(): HTMLDivElement {
  const row = document.createElement('div');
  row.setAttribute('data-bta-row', '');
  row.style.cssText = `
    display: flex;
    align-items: center;
    margin: 4px 0 0 0;
    position: relative;
  `;
  return row;
}

/** テンプレートプルダウンを生成する */
export function createTemplateSelect(): HTMLSelectElement {
  const templateSelect = document.createElement('select');
  templateSelect.setAttribute('data-bta-template-select', '');
  templateSelect.style.cssText = `
    display: none;
    margin-left: 8px;
    padding: 4px 6px;
    font-size: 12px;
    border: 1px solid #ccc;
    border-radius: 4px;
    cursor: pointer;
    max-width: 200px;
  `;
  return templateSelect;
}

/** WAVエクスポートボタンを生成する */
export function createWavExportBtn(): HTMLButtonElement {
  const wavExportBtn = document.createElement('button');
  wavExportBtn.type = 'button';
  wavExportBtn.setAttribute('data-bta-wav-export', '');
  wavExportBtn.textContent = '💾 WAV';
  wavExportBtn.title = 'WAVファイルをエクスポート';
  wavExportBtn.setAttribute('aria-label', 'WAVファイルをエクスポート');
  wavExportBtn.style.cssText = `
    display: none;
    margin-left: 8px;
    padding: 4px 8px;
    font-size: 12px;
    border: 1px solid #ccc;
    border-radius: 4px;
    cursor: pointer;
    background: white;
    white-space: nowrap;
  `;
  return wavExportBtn;
}

/** MML入力用textareaを生成する */
export function createTextarea(): HTMLTextAreaElement {
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
  return textarea;
}

/** abcjs SVG表示用divを生成する */
export function createScoreDiv(): HTMLDivElement {
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
  return scoreDiv;
}

/** playボタン行・textarea・scoreDivを包むラッパーdivを生成する */
export function createWrapper(): HTMLDivElement {
  const wrapper = document.createElement('div');
  wrapper.setAttribute('data-bta-wrapper', '');
  return wrapper;
}

/** historyトグルメニュー項目ボタンを生成する（クリックハンドラは呼び出し元が設定する） */
export function createHistoryToggleMenuItem(): HTMLButtonElement {
  return createMenuItem('history-toggle', '📖 historyを開く');
}

/** historyアイテムのコンテナdivを生成する（ボタン行の下に表示するエリア） */
export function createHistoryContainer(): HTMLDivElement {
  const container = document.createElement('div');
  container.setAttribute('data-bta-history-container', '');
  container.style.cssText = `
    display: none;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    padding: 4px 0;
    margin: 2px 0;
    background: #fafafa;
  `;
  return container;
}

/** historyアイテムの行（playボタン＋お気に入り追加ボタン＋テキストプレビュー）を生成する */
export function createHistoryItem(text: string, onPlay: () => void, onAddToFavorites?: () => void): HTMLDivElement {
  const item = document.createElement('div');
  item.style.cssText = `
    display: flex;
    align-items: center;
    padding: 4px 8px 4px 14px;
    gap: 6px;
  `;

  const playBtn = document.createElement('button');
  playBtn.type = 'button';
  playBtn.innerHTML = `<svg width="10" height="10" viewBox="0 0 16 16" fill="white" xmlns="http://www.w3.org/2000/svg"><polygon points="4,2 14,8 4,14"/></svg>`;
  playBtn.title = 'この履歴をplayする';
  playBtn.setAttribute('aria-label', 'この履歴をplayする');
  playBtn.style.cssText = `
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    padding: 0;
    background: #0085ff;
    color: #fff;
    border: none;
    border-radius: 3px;
    cursor: pointer;
    flex-shrink: 0;
  `;
  playBtn.addEventListener('click', e => {
    e.stopPropagation();
    onPlay();
  });

  const label = document.createElement('span');
  label.textContent = text.length > 30 ? text.slice(0, 30) + '…' : text;
  label.title = text;
  label.style.cssText = `
    font-size: 12px;
    color: #333;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
    cursor: default;
  `;

  if (onAddToFavorites) {
    const favBtn = document.createElement('button');
    favBtn.type = 'button';
    favBtn.textContent = '☆';
    favBtn.title = 'お気に入りに追加';
    favBtn.setAttribute('aria-label', 'お気に入りに追加');
    favBtn.style.cssText = `
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      padding: 0;
      background: none;
      border: 1px solid #ccc;
      border-radius: 3px;
      cursor: pointer;
      font-size: 12px;
      flex-shrink: 0;
      color: #888;
    `;
    favBtn.addEventListener('mouseenter', () => { favBtn.style.background = '#fffbe6'; });
    favBtn.addEventListener('mouseleave', () => { favBtn.style.background = 'none'; });
    favBtn.addEventListener('click', e => {
      e.stopPropagation();
      onAddToFavorites();
    });
    item.append(playBtn, favBtn, label);
  } else {
    item.append(playBtn, label);
  }

  return item;
}

/** お気に入りトグルメニュー項目ボタンを生成する（クリックハンドラは呼び出し元が設定する） */
export function createFavoritesToggleMenuItem(): HTMLButtonElement {
  return createMenuItem('favorites-toggle', '★ お気に入りを開く');
}

/** お気に入りアイテムのコンテナdivを生成する（ボタン行の下に表示するエリア） */
export function createFavoritesContainer(): HTMLDivElement {
  const container = document.createElement('div');
  container.setAttribute('data-bta-favorites-container', '');
  container.style.cssText = `
    display: none;
    border: 1px solid #f0d080;
    border-radius: 4px;
    padding: 4px 0;
    margin: 2px 0;
    background: #fffef0;
  `;
  return container;
}

/** お気に入りアイテムの行（playボタン＋削除ボタン＋テキストプレビュー）を生成する */
export function createFavoritesItem(text: string, onPlay: () => void, onRemove: () => void): HTMLDivElement {
  const item = document.createElement('div');
  item.style.cssText = `
    display: flex;
    align-items: center;
    padding: 4px 8px 4px 14px;
    gap: 6px;
  `;

  const playBtn = document.createElement('button');
  playBtn.type = 'button';
  playBtn.innerHTML = `<svg width="10" height="10" viewBox="0 0 16 16" fill="white" xmlns="http://www.w3.org/2000/svg"><polygon points="4,2 14,8 4,14"/></svg>`;
  playBtn.title = 'このお気に入りをplayする';
  playBtn.setAttribute('aria-label', 'このお気に入りをplayする');
  playBtn.style.cssText = `
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    padding: 0;
    background: #0085ff;
    color: #fff;
    border: none;
    border-radius: 3px;
    cursor: pointer;
    flex-shrink: 0;
  `;
  playBtn.addEventListener('click', e => {
    e.stopPropagation();
    onPlay();
  });

  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.textContent = '★';
  removeBtn.title = 'お気に入りから削除';
  removeBtn.setAttribute('aria-label', 'お気に入りから削除');
  removeBtn.style.cssText = `
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    padding: 0;
    background: none;
    border: 1px solid #ccc;
    border-radius: 3px;
    cursor: pointer;
    font-size: 12px;
    flex-shrink: 0;
    color: #f5a623;
  `;
  removeBtn.addEventListener('mouseenter', () => { removeBtn.style.background = '#ffe0a0'; });
  removeBtn.addEventListener('mouseleave', () => { removeBtn.style.background = 'none'; });
  removeBtn.addEventListener('click', e => {
    e.stopPropagation();
    onRemove();
  });

  const label = document.createElement('span');
  label.textContent = text.length > 30 ? text.slice(0, 30) + '…' : text;
  label.title = text;
  label.style.cssText = `
    font-size: 12px;
    color: #333;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
    cursor: default;
  `;

  item.append(playBtn, removeBtn, label);
  return item;
}
