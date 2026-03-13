import { getAudioContext } from '../audioContext';

// ---- 現在再生中のソースノード（多重再生防止） ----
let currentSource: AudioBufferSourceNode | null = null;

// ---- Surge XT: テキスト → AudioBuffer ----
// local port 62151 にPOSTしてaudio dataを取得する
export async function renderSurgeXTAudioBuffer(text: string): Promise<AudioBuffer> {
  const audioContext = getAudioContext();
  const response = await new Promise<{ success: boolean; audio?: string; error?: string }>(
    (resolve, reject) => {
      chrome.runtime.sendMessage({ type: 'surgeXT', text }, res => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else if (!res) {
          reject(new Error('Surge XT: no response from background script'));
        } else {
          resolve(res as { success: boolean; audio?: string; error?: string });
        }
      });
    },
  );

  if (!response.success || !response.audio) {
    throw new Error(response.error ?? 'Surge XT error');
  }

  const binaryString = atob(response.audio);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return audioContext.decodeAudioData(bytes.buffer);
}

// ---- Surge XT で音声合成・再生 ----
export async function playWithSurgeXT(text: string): Promise<void> {
  if (currentSource) {
    try { currentSource.stop(); } catch { /* already stopped */ }
  }

  const audioContext = getAudioContext();
  if (audioContext.state === 'suspended') {
    await audioContext.resume();
  }

  const decoded = await renderSurgeXTAudioBuffer(text);

  const source = audioContext.createBufferSource();
  source.buffer = decoded;
  source.connect(audioContext.destination);
  currentSource = source;

  await new Promise<void>(resolve => {
    source.onended = () => {
      source.disconnect();
      if (currentSource === source) currentSource = null;
      resolve();
    };
    source.start();
  });
}
