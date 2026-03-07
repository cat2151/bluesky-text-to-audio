export type ToneLib = {
  start(): Promise<void>;
  Transport: {
    start(): void;
    stop(): void;
    cancel(): void;
  };
};

export type SequencerNodes = {
  get(id: number): unknown;
  set(id: number, node: unknown): void;
  disposeAll(): void;
};

export type SequenceEvent = {
  eventType: string;
  nodeId: number;
  nodeType?: string;
  args?: unknown[] | Record<string, unknown>;
  connectTo?: number | 'toDestination';
};

export type SequencerLib = {
  SequencerNodes: new () => SequencerNodes;
  playSequence(Tone: ToneLib, nodes: SequencerNodes, sequence: SequenceEvent[]): Promise<void>;
};
