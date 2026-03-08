import { init, setEnabled } from './observer';

// 初期化時にON/OFF状態を確認してからinit
chrome.storage.session.get({ enabled: true }, (result) => {
  const enabled = typeof result?.enabled === 'boolean' ? result.enabled : true;
  setEnabled(enabled);
  init();
});

chrome.runtime.onMessage.addListener((message: { type: string; enabled?: boolean }) => {
  if (message.type === 'toggleEnabled' && typeof message.enabled === 'boolean') {
    setEnabled(message.enabled);
  }
});
