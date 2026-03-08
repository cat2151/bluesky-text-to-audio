import type { SequencerNodes as SequencerNodesType, SequenceEvent } from './types';

export declare class SequencerNodes implements SequencerNodesType {
  get(id: number): unknown;
  set(id: number, node: unknown): void;
  disposeAll(): void;
}

export declare function scheduleOrExecuteEvent(Tone: unknown, nodes: SequencerNodesType, element: SequenceEvent): void;

export declare function playSequence(Tone: unknown, nodes: SequencerNodesType, sequence: SequenceEvent[]): Promise<void>;
