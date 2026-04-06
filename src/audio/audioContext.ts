// ---- モジュールレベルのAudioContext（再利用） ----
let sharedAudioContext: AudioContext | null = null;
export function getAudioContext(): AudioContext {
  if (!sharedAudioContext || sharedAudioContext.state === 'closed') {
    sharedAudioContext = new AudioContext();
  }
  return sharedAudioContext;
}
