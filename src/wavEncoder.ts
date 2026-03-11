// Convert an AudioBuffer to a WAV Blob (PCM 16-bit, little-endian).
export function audioBufferToWavBlob(audioBuffer: AudioBuffer): Blob {
  const numChannels = audioBuffer.numberOfChannels;
  // Round to integer: WAV header fields are uint32/uint16; fractional values (e.g. YM2151's ~55930.39 Hz) would be truncated silently causing pitch drift.
  const sampleRate = Math.round(audioBuffer.sampleRate);
  const numFrames = audioBuffer.length;

  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const dataLength = numFrames * numChannels * bytesPerSample;

  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);

  // Write an ASCII string into the WAV header at the given byte offset (for RIFF chunk identifiers like 'RIFF', 'WAVE', 'fmt ', 'data').
  function writeString(offset: number, str: string): void {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  // RIFF chunk
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(8, 'WAVE');

  // fmt chunk
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);                                    // chunk size
  view.setUint16(20, 1, true);                                     // PCM format
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * bytesPerSample, true); // byte rate
  view.setUint16(32, numChannels * bytesPerSample, true);          // block align
  view.setUint16(34, bitsPerSample, true);

  // data chunk
  writeString(36, 'data');
  view.setUint32(40, dataLength, true);

  const channels = Array.from({ length: numChannels }, (_, i) => audioBuffer.getChannelData(i));
  let offset = 44;
  for (let i = 0; i < numFrames; i++) {
    for (let c = 0; c < numChannels; c++) {
      const sample = Math.max(-1, Math.min(1, channels[c][i]));
      const scaled = sample < 0 ? sample * 32768 : sample * 32767;
      const int16 = Math.max(-32768, Math.min(32767, Math.round(scaled)));
      view.setInt16(offset, int16, true);
      offset += 2;
    }
  }

  return new Blob([buffer], { type: 'audio/wav' });
}
