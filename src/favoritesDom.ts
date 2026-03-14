// ---- お気に入り UIファクトリ関数 ----

import { createMenuItem } from './playButtonDom';

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

/** お気に入りのexport/importボタンバーを生成する（historyが開いているときに表示する） */
export function createFavoritesExportImportBar(onExport: () => void, onImport: () => void): HTMLDivElement {
  const bar = document.createElement('div');
  bar.style.cssText = `
    display: flex;
    gap: 6px;
    padding: 4px 8px 4px 14px;
    border-top: 1px solid #e8e8e8;
  `;

  const btnStyle = `
    display: inline-flex;
    align-items: center;
    font-size: 11px;
    padding: 2px 6px;
    background: none;
    border: 1px solid #ccc;
    border-radius: 3px;
    cursor: pointer;
    color: #555;
    white-space: nowrap;
  `;

  const exportBtn = document.createElement('button');
  exportBtn.type = 'button';
  exportBtn.textContent = '📤 export';
  exportBtn.title = 'お気に入りをJSONファイルとしてダウンロード';
  exportBtn.setAttribute('aria-label', 'お気に入りをJSONファイルとしてダウンロード');
  exportBtn.style.cssText = btnStyle;
  exportBtn.addEventListener('mouseenter', () => { exportBtn.style.background = '#f0f0f0'; });
  exportBtn.addEventListener('mouseleave', () => { exportBtn.style.background = 'none'; });
  exportBtn.addEventListener('click', e => {
    e.stopPropagation();
    onExport();
  });

  const importBtn = document.createElement('button');
  importBtn.type = 'button';
  importBtn.textContent = '📥 import';
  importBtn.title = 'JSONファイルからお気に入りを上書きインポート';
  importBtn.setAttribute('aria-label', 'JSONファイルからお気に入りを上書きインポート');
  importBtn.style.cssText = btnStyle;
  importBtn.addEventListener('mouseenter', () => { importBtn.style.background = '#f0f0f0'; });
  importBtn.addEventListener('mouseleave', () => { importBtn.style.background = 'none'; });
  importBtn.addEventListener('click', e => {
    e.stopPropagation();
    onImport();
  });

  bar.append(exportBtn, importBtn);
  return bar;
}
