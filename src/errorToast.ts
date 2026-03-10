// ---- エラートーストを表示するファクトリ ----
// container にトーストを追加し、5秒後に自動削除するハンドラを返す
export function createErrorToast(container: HTMLElement): (message: string) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return function showErrorToast(message: string): void {
    container.querySelector('[data-bta-toast]')?.remove();
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
    const toast = document.createElement('div');
    toast.setAttribute('data-bta-toast', '');
    toast.setAttribute('role', 'alert');
    toast.textContent = message;
    toast.style.cssText = `
      margin-left: 8px;
      padding: 4px 10px;
      background: #d32f2f;
      color: #fff;
      border-radius: 4px;
      font-size: 12px;
      max-width: 260px;
      white-space: normal;
      word-break: break-word;
      pointer-events: none;
    `;
    container.append(toast);
    timer = setTimeout(() => {
      toast.remove();
      timer = null;
    }, 5000);
  };
}
