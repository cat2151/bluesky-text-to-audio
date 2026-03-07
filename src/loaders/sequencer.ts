import type { SequencerLib, SequencerNodes } from '../types';

const LOG_PREFIX = '[BTA:loaders/sequencer]';

// tonejs-json-sequencer を CDN から動的ロード（CJS mini-loader）
// cat2151ライブラリは常に最新mainを使用、バージョン固定しない
const SEQUENCER_CDN_BASE = 'https://cdn.jsdelivr.net/gh/cat2151/tonejs-json-sequencer@main/dist/cjs/';

let sequencerPromise: Promise<SequencerLib> | null = null;

export function loadSequencer(): Promise<SequencerLib> {
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
