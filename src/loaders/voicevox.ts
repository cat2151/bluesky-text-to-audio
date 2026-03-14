import { getAudioContext } from '../audioContext';

// ---- 現在再生中のソースノード（多重再生防止） ----
let currentSource: AudioBufferSourceNode | null = null;

// ---- WAVデータキャッシュ（textをkey、AudioBufferをvalueとして保持） ----
// エントリ数に上限を設けて古いものから破棄する（メモリ使用量の無制限増大を防ぐ）
const MAX_AUDIO_CACHE_ENTRIES = 32;

class BoundedMap<K, V> extends Map<K, V> {
  override set(key: K, value: V): this {
    if (this.size >= MAX_AUDIO_CACHE_ENTRIES) {
      const oldestKey = this.keys().next().value as K | undefined;
      if (oldestKey !== undefined) {
        this.delete(oldestKey);
      }
    }
    return super.set(key, value);
  }
}

const audioCache = new BoundedMap<string, AudioBuffer>();

// ---- VOICEVOX: テキスト → AudioBuffer（キャッシュ付き）----
// mix.ts からも利用できるよう export する。
export async function renderVoicevoxAudioBuffer(text: string): Promise<AudioBuffer> {
  const audioContext = getAudioContext();
  let decoded = audioCache.get(text);
  if (!decoded) {
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

    decoded = await audioContext.decodeAudioData(bytes.buffer);
    audioCache.set(text, decoded);
  }
  return decoded;
}

// ---- VOICEVOX で音声合成・再生 ----
export async function playWithVoicevox(text: string, onPlayStart?: () => void): Promise<void> {
  // 再生中の音声を停止してから新しい再生を開始する
  // onendedはそのまま残す（stop()でonendedが発火し、待機中のpromiseが解決される）
  // currentSourceのnull化はonendedハンドラーに委ねる
  if (currentSource) {
    try { currentSource.stop(); } catch { /* already stopped */ }
  }

  const audioContext = getAudioContext();
  if (audioContext.state === 'suspended') {
    await audioContext.resume();
  }

  const decoded = await renderVoicevoxAudioBuffer(text);

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
