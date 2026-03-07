import * as ABCJS from 'abcjs';
import { parse as mml2abcParse } from './mml2abc.mjs';

const LOG_PREFIX = '[BTA:content]';

// ---- chord2mml を CDN から動的ロード（cat2151ライブラリは常に最新mainを使用、バージョン固定しない） ----
const CHORD2MML_CDN_URL = 'https://cdn.jsdelivr.net/gh/cat2151/chord2mml/dist/chord2mml.js';

// ---- Tone.js を CDN から動的ロード ----
const TONE_CDN_URL = 'https://cdn.jsdelivr.net/npm/tone@15/build/Tone.js';

type ToneLib = {
  start(): Promise<void>;
  Transport: {
    start(): void;
    stop(): void;
    cancel(): void;
  };
};

let tonePromise: Promise<ToneLib> | null = null;

function loadTone(): Promise<ToneLib> {
  if (!tonePromise) {
    tonePromise = fetch(TONE_CDN_URL)
      .then(resp => resp.text())
      .then(code => {
        // UMDビルドをFunction内で実行し、self.Tone（グローバル）にエクスポートされる
        new Function(code)();
        const Tone = (globalThis as Record<string, unknown>)['Tone'] as ToneLib | undefined;
        if (!Tone) throw new Error('Tone.js の読み込みに失敗しました');
        return Tone;
      })
      .catch((e: unknown) => {
        console.error(LOG_PREFIX, 'Tone.js の読み込みに失敗しました:', e);
        tonePromise = null;
        return Promise.reject(e);
      });
  }
  return tonePromise;
}

// ---- tonejs-json-sequencer を CDN から動的ロード（CJS mini-loader） ----
// cat2151ライブラリは常に最新mainを使用、バージョン固定しない
const SEQUENCER_CDN_BASE = 'https://cdn.jsdelivr.net/gh/cat2151/tonejs-json-sequencer@main/dist/cjs/';

type SequencerNodes = {
  get(id: number): unknown;
  set(id: number, node: unknown): void;
  disposeAll(): void;
};

type SequencerLib = {
  SequencerNodes: new () => SequencerNodes;
  playSequence(Tone: ToneLib, nodes: SequencerNodes, sequence: SequenceEvent[]): Promise<void>;
};

type SequenceEvent = {
  eventType: string;
  nodeId: number;
  nodeType?: string;
  args?: unknown[] | Record<string, unknown>;
  connectTo?: number | 'toDestination';
};

let sequencerPromise: Promise<SequencerLib> | null = null;

function loadSequencer(): Promise<SequencerLib> {
  if (!sequencerPromise) {
    sequencerPromise = (async () => {
      // CJS ミニモジュールローダー
      const registry: Record<string, Record<string, unknown>> = {};

      async function loadCjsFile(registryKey: string, fetchPath: string): Promise<void> {
        if (registry[registryKey]) return;
        const code = await fetch(SEQUENCER_CDN_BASE + fetchPath).then(r => r.text());
        const mod: { exports: Record<string, unknown> } = { exports: {} };
        const requireFn = (dep: string): Record<string, unknown> => {
          const loadedModule = registry[dep];
          if (!loadedModule) {
            throw new Error(
              `tonejs-json-sequencer CJS loader: missing dependency "${dep}" (required by "${registryKey}")`
            );
          }
          return loadedModule;
        };
        new Function('exports', 'require', 'module', code)(mod.exports, requireFn, mod);
        registry[registryKey] = mod.exports;
      }

      // 依存順にロード
      await loadCjsFile('./sequencer-nodes.js', 'sequencer-nodes.js');
      await loadCjsFile('./factories/instrument-factory.js', 'factories/instrument-factory.js');
      await loadCjsFile('./factories/effect-factory.js', 'factories/effect-factory.js');
      await loadCjsFile('./node-factory.js', 'node-factory.js');
      await loadCjsFile('./event-scheduler.js', 'event-scheduler.js');

      const SeqNodes = registry['./sequencer-nodes.js']['SequencerNodes'] as new () => SequencerNodes;
      const playSeq = registry['./event-scheduler.js']['playSequence'] as SequencerLib['playSequence'];

      return { SequencerNodes: SeqNodes, playSequence: playSeq };
    })().catch((e: unknown) => {
      console.error(LOG_PREFIX, 'tonejs-json-sequencer の読み込みに失敗しました:', e);
      sequencerPromise = null;
      return Promise.reject(e);
    });
  }
  return sequencerPromise;
}

// ---- tonejs-mml-to-json を CDN から動的ロード ----
// cat2151ライブラリは常に最新mainを使用、バージョン固定しない
// このライブラリはESM+WASMのため、CDNからの直接ロードにはライブラリ側のUMD/IIFEビルドが必要。
// 現在はフォールバックとして基本的なMMLパーサーを使用する。
// ライブラリ側にUMD/IIFEビルドが追加されたら、このパーサーをライブラリに差し替える予定。
// TODO: cat2151/tonejs-mml-to-json に UMD/IIFE ビルド追加を提案する

// ---- 基本MMLパーサー（tonejs-mml-to-json のCDNロードが可能になるまでの暫定実装） ----
function parseMmlToSequence(mml: string): SequenceEvent[] {
  const NOTE_MAP: Record<string, string> = {
    c: 'C', d: 'D', e: 'E', f: 'F', g: 'G', a: 'A', b: 'B',
  };
  const SHARP_MAP: Record<string, string> = {
    c: 'C#', d: 'D#', f: 'F#', g: 'G#', a: 'A#',
  };
  const FLAT_MAP: Record<string, string> = {
    d: 'Db', e: 'Eb', g: 'Gb', a: 'Ab', b: 'Bb',
  };

  let octave = 4;
  let length = 4; // デフォルト4分音符
  let defaultDotted = false; // l4. のような付点デフォルト長フラグ
  let pos = 0;
  const input = mml.toLowerCase().replace(/\s+/g, '');
  const events: SequenceEvent[] = [
    { eventType: 'createNode', nodeId: 0, nodeType: 'Synth', args: {} },
    { eventType: 'connect', nodeId: 0, connectTo: 'toDestination' },
  ];

  // 経過16分音符数で時刻管理
  let sixteenths = 0;

  function toToneTime(s: number): string {
    const bars = Math.floor(s / 16);
    const beats = Math.floor((s % 16) / 4);
    const sixteenthsInBeat = s % 4;
    return `${bars}:${beats}:${sixteenthsInBeat}`;
  }

  function parseLengthNum(defaultLen: number): number {
    let len = 0;
    while (pos < input.length && input[pos] >= '0' && input[pos] <= '9') {
      len = len * 10 + parseInt(input[pos]);
      pos++;
    }
    return len > 0 ? len : defaultLen;
  }

  while (pos < input.length) {
    const ch = input[pos];

    if (ch === 'o') {
      pos++;
      const oct = parseInt(input[pos] ?? '4');
      if (!isNaN(oct)) { octave = oct; pos++; }
    } else if (ch === 'l') {
      pos++;
      length = parseLengthNum(length);
      if (pos < input.length && input[pos] === '.') {
        defaultDotted = true; // 付点デフォルト長（分母は変えず、フラグで管理）
        pos++;
      } else {
        defaultDotted = false;
      }
    } else if (ch === '>') {
      octave = Math.min(octave + 1, 8); pos++;
    } else if (ch === '<') {
      octave = Math.max(octave - 1, 1); pos++;
    } else if (ch === 'r') {
      pos++;
      const noteLen = parseLengthNum(length);
      let restDotted = defaultDotted;
      if (pos < input.length && input[pos] === '.') { restDotted = true; pos++; }
      const stepSixteenths = restDotted
        ? Math.round(16 / noteLen * 1.5)
        : Math.round(16 / noteLen);
      sixteenths += stepSixteenths;
    } else if (NOTE_MAP[ch]) {
      pos++;
      let noteName = NOTE_MAP[ch];
      // シャープ/フラット（'-'でフラット、'+'または'#'でシャープ。'b'はBノート名として扱う）
      if (pos < input.length && (input[pos] === '+' || input[pos] === '#')) {
        noteName = SHARP_MAP[ch] ?? noteName;
        pos++;
      } else if (pos < input.length && input[pos] === '-') {
        noteName = FLAT_MAP[ch] ?? noteName;
        pos++;
      }
      const noteLen = parseLengthNum(length);
      let dotted = defaultDotted;
      if (pos < input.length && input[pos] === '.') { dotted = true; pos++; }
      const stepSixteenths = dotted
        ? Math.round(16 / noteLen * 1.5)
        : Math.round(16 / noteLen);
      const durationStr = `${noteLen}n${dotted ? '.' : ''}`;
      const toneNote = `${noteName}${octave}`;
      const timeStr = toToneTime(sixteenths);
      events.push({
        eventType: 'triggerAttackRelease',
        nodeId: 0,
        args: [toneNote, durationStr, timeStr],
      });
      sixteenths += stepSixteenths;
    } else if (ch === 't') {
      // テンポ（無視）
      pos++;
      while (pos < input.length && input[pos] >= '0' && input[pos] <= '9') pos++;
    } else if (ch === 'v') {
      // ボリューム（無視）
      pos++;
      while (pos < input.length && input[pos] >= '0' && input[pos] <= '9') pos++;
    } else {
      pos++;
    }
  }

  if (sixteenths > 0) {
    events.push({ eventType: 'loopEnd', nodeId: 0, args: [toToneTime(sixteenths)] });
  }

  return events;
}

type Chord2mmlLib = { parse(chord: string): string };

const chord2mmlPromise: Promise<Chord2mmlLib> = fetch(CHORD2MML_CDN_URL)
  .then(resp => resp.text())
  .then(code => {
    // UMD バンドルを Function スコープで実行し chord2mml オブジェクトを取得
    const fn = new Function(`const self={};\n${code}\nreturn self.chord2mml;`);
    return fn() as Chord2mmlLib;
  })
  .catch((e: unknown) => {
    console.error(LOG_PREFIX, 'chord2mml の読み込みに失敗しました:', e);
    return Promise.reject(e);
  });

// ---- 処理済み投稿を管理 ----
const processedPosts = new WeakSet<HTMLElement>();

// ---- 投稿テキストを取得 ----
function getPostText(postEl: HTMLElement): string {
  const textEl = postEl.querySelector('[data-testid="postText"]');
  if (textEl instanceof HTMLElement) return textEl.innerText;
  // フォールバック: 注入したwrapper要素ごと除外してテキストを取得
  const clone = postEl.cloneNode(true) as HTMLElement;
  clone.querySelectorAll('[data-bta-wrapper]').forEach(el => el.remove());
  return clone.innerText || '';
}

// ---- コード進行テキストをMMLに変換（方言を正規化しつつパース、成功したMMLを直接返す） ----
function chordToMml(chord: string, chord2mml: Chord2mmlLib): string {
  function replaceHyphenToDot(s: string): string {
    return s.replace(/-/g, '・');
  }
  function replaceMinorRomanNumerals(s: string): string {
    return s
      .replace(/\bvii(?![a-zA-Z])/g, 'VIIm')
      .replace(/\biii(?![a-zA-Z])/g, 'IIIm')
      .replace(/\bvi(?![a-zA-Z])/g, 'VIm')
      .replace(/\biv(?![a-zA-Z])/g, 'IVm')
      .replace(/\bii(?![a-zA-Z])/g, 'IIm')
      .replace(/\bv(?![a-zA-Z])/g, 'Vm')
      .replace(/\bi(?![a-zA-Z])/g, 'Im');
  }
  function permute(arr: Array<(s: string) => string>): Array<Array<(s: string) => string>> {
    if (arr.length <= 1) return [arr];
    const result: Array<Array<(s: string) => string>> = [];
    for (let i = 0; i < arr.length; i++) {
      const rest = arr.slice(0, i).concat(arr.slice(i + 1));
      for (const p of permute(rest)) result.push([arr[i], ...p]);
    }
    return result;
  }
  function getAllCombinations(funcs: Array<(s: string) => string>): Array<Array<(s: string) => string>> {
    const results: Array<Array<(s: string) => string>> = [];
    const n = funcs.length;
    for (let i = 0; i < (1 << n); i++) {
      const seq: Array<(s: string) => string> = [];
      for (let j = 0; j < n; j++) {
        if (i & (1 << j)) seq.push(funcs[j]);
      }
      results.push(...(seq.length === 0 ? [[(x: string) => x]] : permute(seq)));
    }
    return results;
  }

  const transforms: Array<(s: string) => string> = [replaceHyphenToDot, replaceMinorRomanNumerals];
  const tried = new Set<string>();
  for (const seq of getAllCombinations(transforms)) {
    let candidate = chord;
    for (const fn of seq) candidate = fn(candidate);
    if (tried.has(candidate)) continue;
    tried.add(candidate);
    try {
      return chord2mml.parse(candidate);
    } catch (_e) {}
  }
  return chord2mml.parse(chord);
}

// ---- playボタン行とtextareaを追加 ----
function addPlayButton(postEl: HTMLElement): void {
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

  // ボタン行コンテナ
  const row = document.createElement('div');
  row.setAttribute('data-bta-row', '');
  row.style.cssText = `
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    margin: 4px 0;
  `;
  row.append(toggleBtn, mmlabcBtn, playBtn, chord2mmlBtn, tonejsBtn);

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
    let chord2mml: Chord2mmlLib;
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

    let Tone: ToneLib;
    let sequencer: SequencerLib;
    try {
      [Tone, sequencer] = await Promise.all([loadTone(), loadSequencer()]);
    } catch (e2: unknown) {
      console.error(LOG_PREFIX, 'Tone.js または tonejs-json-sequencer の読み込みに失敗しました:', e2);
      return;
    }

    // MML → tonejs-json-sequencer用JSONに変換（tonejs-mml-to-json のCDNロード可能なビルドが提供されたら差し替え予定）
    let sequence: SequenceEvent[];
    try {
      sequence = parseMmlToSequence(mml);
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

  const wrapper = document.createElement('div');
  wrapper.setAttribute('data-bta-wrapper', '');
  wrapper.append(row, textarea, scoreDiv);

  postEl.prepend(wrapper);
}

// ---- 投稿要素を検出 ----
function findPostElements(): NodeListOf<HTMLElement> {
  return document.querySelectorAll<HTMLElement>('[data-testid^="feedItem-"]');
}

// ---- 全投稿にplayボタンを追加 ----
function scanPosts(): void {
  findPostElements().forEach(postEl => addPlayButton(postEl));
}

// ---- MutationObserverで新規投稿を監視 ----
function init(): void {
  // 既存の投稿を一度だけ全走査
  scanPosts();

  // 以降は MutationObserver の addedNodes から増分処理
  const observer = new MutationObserver(mutationsList => {
    mutationsList.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (!(node instanceof HTMLElement)) return;

        // 追加されたノード自体が投稿要素の場合
        if (node.matches('[data-testid^="feedItem-"]')) {
          addPlayButton(node);
        }

        // 追加されたノード配下に含まれる投稿要素を処理
        if (node.querySelectorAll) {
          node
            .querySelectorAll<HTMLElement>('[data-testid^="feedItem-"]')
            .forEach(postEl => addPlayButton(postEl));
        }
      });
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

init();
