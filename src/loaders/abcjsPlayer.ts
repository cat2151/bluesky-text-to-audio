import * as ABCJS from 'abcjs';

const LOG_PREFIX = '[BTA:playButton]';

// ---- ABCテキストを五線譜表示し演奏するクラス ----
export class AbcjsPlayer {
  private synthInstance: ABCJS.MidiBuffer | null = null;

  renderAndPlay(scoreDiv: HTMLElement, abcText: string): void {
    scoreDiv.style.display = 'block';
    const tuneObjects = ABCJS.renderAbc(scoreDiv, abcText);
    const visualObj = tuneObjects[0];
    if (!visualObj) return;

    if (ABCJS.synth.supportsAudio()) {
      if (!this.synthInstance) {
        this.synthInstance = new ABCJS.synth.CreateSynth();
      } else {
        // 既存のシンセが再生中の場合は、再初期化前に必ず停止する
        this.synthInstance.stop();
      }
      this.synthInstance
        .init({ visualObj, options: {} })
        .then(() => this.synthInstance!.prime())
        .then(() => {
          // 再生開始（easyabcjs6と同様に stop() してから start() する）
          this.synthInstance!.stop();
          this.synthInstance!.start();
        })
        .catch((error: unknown) => {
          console.warn(LOG_PREFIX, 'Audio problem:', error);
        });
    } else {
      console.error(LOG_PREFIX, 'Audio is not supported in this browser.');
    }
  }
}
