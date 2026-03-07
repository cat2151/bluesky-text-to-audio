const VOICEVOX_API_BASE = 'http://localhost:50021';
const SPEAKER_ID = 3; // ずんだもん ノーマル

const LOG_PREFIX = '[BTA:background]';

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const uint8Array = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < uint8Array.length; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  return btoa(binary);
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
      speakText(message.text)
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
