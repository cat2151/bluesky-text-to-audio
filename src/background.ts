const VOICEVOX_API_BASE = 'http://localhost:50021';
const SPEAKER_ID = 3; // ずんだもん ノーマル

const LOG_PREFIX = '[BTA:background]';

// ---- ON/OFFトグル ----
async function getEnabled(): Promise<boolean> {
  const result = await chrome.storage.session.get({ enabled: true });
  return result.enabled as boolean;
}

async function applyEnabled(enabled: boolean): Promise<void> {
  await chrome.storage.session.set({ enabled });
  chrome.action.setBadgeText({ text: enabled ? '' : 'OFF' });
  chrome.action.setBadgeBackgroundColor({ color: '#cc0000' });
}

// 起動時にバッジ表示を同期
getEnabled().then(enabled => applyEnabled(enabled));

chrome.action.onClicked.addListener(async (tab) => {
  const enabled = await getEnabled();
  const newEnabled = !enabled;
  await applyEnabled(newEnabled);

  if (tab.id !== undefined) {
    chrome.tabs.sendMessage(tab.id, { type: 'toggleEnabled', enabled: newEnabled }).catch((err: unknown) => {
      console.debug(LOG_PREFIX, 'toggleEnabled message failed (content script may not be loaded):', err);
    });
  }
});

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const uint8Array = new Uint8Array(buffer);
  const chunkSize = 0x8000; // 32KB chunks to avoid large intermediate strings
  const chunks: string[] = [];

  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    const end = Math.min(i + chunkSize, uint8Array.length);
    const charCodes: string[] = [];
    for (let j = i; j < end; j++) {
      charCodes.push(String.fromCharCode(uint8Array[j]));
    }
    chunks.push(charCodes.join(''));
  }

  return btoa(chunks.join(''));
}

async function speakText(text: string): Promise<string> {
  const queryResponse = await fetch(
    `${VOICEVOX_API_BASE}/audio_query?text=${encodeURIComponent(text)}&speaker=${SPEAKER_ID}`,
    { method: 'POST' },
  );
  if (!queryResponse.ok) {
    throw new Error(`audio_query failed: ${queryResponse.status} ${queryResponse.statusText}`);
  }
  const audioQuery = await queryResponse.json();

  const synthesisResponse = await fetch(
    `${VOICEVOX_API_BASE}/synthesis?speaker=${SPEAKER_ID}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(audioQuery),
    },
  );
  if (!synthesisResponse.ok) {
    throw new Error(`synthesis failed: ${synthesisResponse.status} ${synthesisResponse.statusText}`);
  }
  const audioBuffer = await synthesisResponse.arrayBuffer();
  return arrayBufferToBase64(audioBuffer);
}

chrome.runtime.onMessage.addListener(
  (message: { type: string; text: string }, _sender, sendResponse) => {
    if (message.type === 'speak') {
      const text = message.text;
      if (typeof text !== 'string' || text.trim().length === 0) {
        console.error(LOG_PREFIX, 'Invalid text for speak request:', text);
        sendResponse({
          success: false,
          error: 'Invalid text for speak request',
        });
        return false;
      }

      speakText(text)
        .then(base64Audio => sendResponse({ success: true, audio: base64Audio }))
        .catch((error: unknown) => {
          console.error(LOG_PREFIX, 'VOICEVOX error:', error);
          sendResponse({
            success: false,
            error: error instanceof Error ? error.message : String(error),
          });
        });
      return true; // Keep the message channel open for async response
    }
  },
);
