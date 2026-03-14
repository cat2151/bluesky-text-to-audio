// ---- history UIファクトリ関数 ----

import { createMenuItem } from './playButtonDom';

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

/** historyアイテムの行（playボタン＋テキストプレビュー）を生成する。onAddToFavorites が指定された場合はお気に入り追加ボタン（☆）も表示する */
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
