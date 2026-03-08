import { getAudioContext } from '../audioContext';

// ---- VOICEVOX で音声合成・再生 ----
export async function playWithVoicevox(text: string): Promise<void> {
  const response = await new Promise<{ success: boolean; audio?: string; error?: string }>(
    (resolve, reject) => {
      chrome.runtime.sendMessage({ type: 'speak', text }, res => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else if (!res) {
          reject(new Error('VOICEVOX: no response from background script'));
        } else {
          resolve(res as { success: boolean; audio?: string; error?: string });
        }
      });
    },
  );

  if (!response.success || !response.audio) {
    throw new Error(response.error ?? 'VOICEVOX error');
  }

  const binaryString = atob(response.audio);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const audioContext = getAudioContext();
  if (audioContext.state === 'suspended') {
    await audioContext.resume();
  }
  const decoded = await audioContext.decodeAudioData(bytes.buffer);
  const source = audioContext.createBufferSource();
  source.buffer = decoded;
  source.connect(audioContext.destination);
  source.onended = () => { source.disconnect(); };
  source.start();
}
