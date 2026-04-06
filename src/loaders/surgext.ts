import { getAudioContext } from '../audio/audioContext';

// ---- 現在再生中のソースノード（多重再生防止） ----
let currentSource: AudioBufferSourceNode | null = null;

// ---- Surge XT: テキスト → AudioBuffer ----
export async function renderSurgeXtAudioBuffer(text: string): Promise<AudioBuffer> {
  const audioContext = getAudioContext();

  const response = await new Promise<{ success: boolean; audio?: string; error?: string }>(
    (resolve, reject) => {
      chrome.runtime.sendMessage({ type: 'surgextRender', text }, res => {
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
    const errMsg = response.error ?? 'error';
    throw new Error(errMsg.startsWith('Surge XT') ? errMsg : `Surge XT: ${errMsg}`);
  }

  const binaryString = atob(response.audio);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return audioContext.decodeAudioData(bytes.buffer);
}

// ---- Surge XT で音声合成・再生 ----
export async function playWithSurgeXt(text: string, onPlayStart?: () => void): Promise<void> {
  if (currentSource) {
    try { currentSource.stop(); } catch { /* already stopped */ }
  }

  const audioContext = getAudioContext();
  if (audioContext.state === 'suspended') {
    await audioContext.resume();
  }

  const decoded = await renderSurgeXtAudioBuffer(text);

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
    try { onPlayStart?.(); } catch { /* UI callback must not break playback */ }
  });
}
