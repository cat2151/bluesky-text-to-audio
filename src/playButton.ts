import * as ABCJS from 'abcjs';
import { parse as mml2abcParse } from './mml2abc.mjs';
import type { SequencerNodes } from './types';
import { loadTone } from './loaders/tone';
import { loadSequencer } from './loaders/sequencer';
import { parseMmlViaLibrary } from './loaders/mmlToJson';
import { chord2mmlPromise } from './loaders/chord2mml';
import { chordToMml } from './chordToMml';
import { getPostText } from './postText';

const LOG_PREFIX = '[BTA:playButton]';

// ---- モジュールレベルのAudioContext（再利用） ----
let sharedAudioContext: AudioContext | null = null;
function getAudioContext(): AudioContext {
  if (!sharedAudioContext || sharedAudioContext.state === 'closed') {
    sharedAudioContext = new AudioContext();
  }
  return sharedAudioContext;
}

// ---- 処理済み投稿を管理 ----
const processedPosts = new WeakSet<HTMLElement>();

// ---- playボタン行とtextareaを追加 ----
export function addPlayButton(postEl: HTMLElement): void {
  if (processedPosts.has(postEl)) return;
  processedPosts.add(postEl);

  const btnStyle = `
    display: inline-flex;
    align-items: center;
    margin: 4px 4px 4px 4px;
    padding: 4px 10px;
    background: #0085ff;
    color: #fff;
    border: none;
    border-radius: 4px;
    font-size: 13px;
    cursor: pointer;
    z-index: 1;
  `;

  // textareaを開く/閉じるボタン
  const toggleBtn = document.createElement('button');
  toggleBtn.type = 'button';
  toggleBtn.setAttribute('data-bta-play', '');
  toggleBtn.textContent = '▶ textareaを開く';
  toggleBtn.style.cssText = btnStyle;

  // mmlabcでplayボタン
  const mmlabcBtn = document.createElement('button');
  mmlabcBtn.type = 'button';
  mmlabcBtn.setAttribute('data-bta-mmlabc', '');
  mmlabcBtn.textContent = '🎵 mmlabcでplay';
  mmlabcBtn.style.cssText = btnStyle;

  // abcjs playボタン
  const playBtn = document.createElement('button');
  playBtn.type = 'button';
  playBtn.setAttribute('data-bta-abcplay', '');
  playBtn.textContent = '▶ abcjsでplay';
  playBtn.style.cssText = btnStyle;

  // chord2mml playボタン
  const chord2mmlBtn = document.createElement('button');
  chord2mmlBtn.type = 'button';
  chord2mmlBtn.setAttribute('data-bta-chord2mml', '');
  chord2mmlBtn.textContent = '🎸 chord2mmlでplay';
  chord2mmlBtn.style.cssText = btnStyle;

  // Tone.js playボタン
  const tonejsBtn = document.createElement('button');
  tonejsBtn.type = 'button';
  tonejsBtn.setAttribute('data-bta-tonejs', '');
  tonejsBtn.textContent = '🎹 Tone.jsでplay';
  tonejsBtn.style.cssText = btnStyle;

  // 「投稿を読み上げる」ボタン（VOICEVOX）
  const voicevoxBtn = document.createElement('button');
  voicevoxBtn.type = 'button';
  voicevoxBtn.setAttribute('data-bta-voicevox', '');
  voicevoxBtn.textContent = '🔊 投稿を読み上げる';
  voicevoxBtn.style.cssText = btnStyle;

  // ボタン行コンテナ
  const row = document.createElement('div');
  row.setAttribute('data-bta-row', '');
  row.style.cssText = `
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    margin: 4px 0;
  `;
  row.append(toggleBtn, mmlabcBtn, playBtn, chord2mmlBtn, tonejsBtn, voicevoxBtn);

  // textarea
  const textarea = document.createElement('textarea');
  textarea.setAttribute('data-bta-textarea', '');
  textarea.style.cssText = `
    display: none;
    width: 100%;
    box-sizing: border-box;
    margin: 4px 0;
    padding: 6px 8px;
    font-size: 13px;
    border: 1px solid #0085ff;
    border-radius: 4px;
    resize: vertical;
    min-height: 80px;
  `;

  // abcjs SVG表示用div
  const scoreDiv = document.createElement('div');
  scoreDiv.setAttribute('data-bta-score', '');
  scoreDiv.style.cssText = `
    display: none;
    background: white;
    color: black;
    border: 1px solid #ccc;
    border-radius: 4px;
    padding: 4px;
    margin: 4px 0;
  `;

  // textarea上でのポインタイベント（click/mousedown）が親要素に伝播してページ遷移しないようにする
  textarea.addEventListener('click', e => { e.stopPropagation(); });
  textarea.addEventListener('mousedown', e => { e.stopPropagation(); });

  // 投稿ごとのシンセインスタンス
  let synthInstance: ABCJS.MidiBuffer | null = null;

  // ---- ABCテキストを五線譜表示し演奏する共通ヘルパー ----
  function renderAndPlay(abcText: string): void {
    scoreDiv.style.display = 'block';
    const tuneObjects = ABCJS.renderAbc(scoreDiv, abcText);
    const visualObj = tuneObjects[0];
    if (!visualObj) return;

    if (ABCJS.synth.supportsAudio()) {
      if (!synthInstance) {
        synthInstance = new ABCJS.synth.CreateSynth();
      } else {
        // 既存のシンセが再生中の場合は、再初期化前に必ず停止する
        synthInstance.stop();
      }
      synthInstance
        .init({ visualObj, options: {} })
        .then(() => synthInstance!.prime())
        .then(() => {
          // 再生開始（easyabcjs6と同様に stop() してから start() する）
          synthInstance!.stop();
          synthInstance!.start();
        })
        .catch((error: unknown) => {
          console.warn(LOG_PREFIX, 'Audio problem:', error);
        });
    } else {
      console.error(LOG_PREFIX, 'Audio is not supported in this browser.');
    }
  }

  toggleBtn.addEventListener('click', e => {
    e.stopPropagation();
    if (textarea.style.display === 'none') {
      // 初回のみ投稿テキストをセット（ユーザー編集を保持）
      if (!textarea.value) {
        textarea.value = getPostText(postEl);
      }
      textarea.style.display = 'block';
    } else {
      textarea.style.display = 'none';
    }
  });

  mmlabcBtn.addEventListener('click', e => {
    e.stopPropagation();
    // 未初期化の場合は投稿テキストをセット
    if (!textarea.value) {
      textarea.value = getPostText(postEl);
    }
    const mml = textarea.value;
    let abcText = '';
    try {
      abcText = mml2abcParse(mml);
    } catch (error) {
      console.error(LOG_PREFIX, 'MML parse error:', error);
      return;
    }
    renderAndPlay(abcText);
  });

  playBtn.addEventListener('click', e => {
    e.stopPropagation();
    // 未初期化の場合は投稿テキストをセット
    if (!textarea.value) {
      textarea.value = getPostText(postEl);
    }
    renderAndPlay(textarea.value);
  });

  chord2mmlBtn.addEventListener('click', async e => {
    e.stopPropagation();
    // 未初期化の場合は投稿テキストをセット
    if (!textarea.value) {
      textarea.value = getPostText(postEl);
    }
    const chord = textarea.value;
    let chord2mml;
    try {
      chord2mml = await chord2mmlPromise;
    } catch {
      console.error(LOG_PREFIX, 'chord2mml が利用できません');
      return;
    }
    let abcText = '';
    try {
      const mml = chordToMml(chord, chord2mml);
      abcText = mml2abcParse(mml);
    } catch (error) {
      console.error(LOG_PREFIX, 'chord2mml parse error:', error);
      return;
    }
    renderAndPlay(abcText);
  });

  // ---- Tone.js playボタン ----
  // 投稿ごとのSequencerNodesインスタンス（Tone.jsシーケンサー用）
  let tonejsNodes: SequencerNodes | null = null;

  tonejsBtn.addEventListener('click', async e => {
    e.stopPropagation();
    // 未初期化の場合は投稿テキストをセット
    if (!textarea.value) {
      textarea.value = getPostText(postEl);
    }
    const mml = textarea.value;

    let Tone;
    let sequencer;
    try {
      [Tone, sequencer] = await Promise.all([loadTone(), loadSequencer()]);
    } catch (e2: unknown) {
      console.error(LOG_PREFIX, 'Tone.js または tonejs-json-sequencer の読み込みに失敗しました:', e2);
      return;
    }

    // MML → tonejs-json-sequencer用JSONに変換（tonejs-mml-to-json ライブラリ使用）
    let sequence;
    try {
      sequence = await parseMmlViaLibrary(mml);
    } catch (e2: unknown) {
      console.error(LOG_PREFIX, 'MML parse error:', e2);
      return;
    }

    try {
      await Tone.start();
      if (!tonejsNodes) {
        tonejsNodes = new sequencer.SequencerNodes();
      }
      await sequencer.playSequence(Tone, tonejsNodes, sequence);
      Tone.Transport.start();
    } catch (e2: unknown) {
      console.error(LOG_PREFIX, 'Tone.js play error:', e2);
    }
  });

  // ---- 「投稿を読み上げる」ボタン（VOICEVOX） ----
  voicevoxBtn.addEventListener('click', async e => {
    e.stopPropagation();
    // 未初期化の場合は投稿テキストをセット（textareaの編集内容を優先）
    let text = textarea.value;
    if (!text) {
      text = getPostText(postEl);
      textarea.value = text;
    }
    if (!text) return;

    voicevoxBtn.disabled = true;
    voicevoxBtn.textContent = '🔊 読み上げ中...';
    try {
      const response = await new Promise<{ success: boolean; audio?: string; error?: string }>(
        (resolve, reject) => {
          chrome.runtime.sendMessage({ type: 'speak', text }, res => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              resolve(res as { success: boolean; audio?: string; error?: string });
            }
          });
        },
      );

      if (!response.success || !response.audio) {
        console.error(LOG_PREFIX, 'VOICEVOX error:', response.error);
        return;
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
    } catch (err: unknown) {
      console.error(LOG_PREFIX, 'VOICEVOX error:', err);
    } finally {
      voicevoxBtn.disabled = false;
      voicevoxBtn.textContent = '🔊 投稿を読み上げる';
    }
  });

  const wrapper = document.createElement('div');
  wrapper.setAttribute('data-bta-wrapper', '');
  wrapper.append(row, textarea, scoreDiv);

  postEl.prepend(wrapper);
}
