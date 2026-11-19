import type { WorldSessionAdvance, WorldSessionEdge } from './world-session.js';
import type { TimelineSample } from './twinfile-time.js';

/** In-process session clock bus — discrete **notes** on the scenario `step` grid (not the patch module bus). */
export type SessionClockNote = {
  /** Seconds since `clock.starts_at` (snapped to grid). */
  t: number;
  /** Index on the step scale: `t / stepS`. */
  index: number;
  sample: TimelineSample;
};

export type SessionClockTransport = {
  state: 'playing' | 'paused';
};

export type SessionClockBusEvents = {
  /** One grid position struck (like a note on a scale). */
  note: SessionClockNote;
  /** Boundary crossed between samples (phase, schedule, mode). */
  edge: WorldSessionEdge;
  /** Full playhead move (notes + edges emitted separately). */
  advance: WorldSessionAdvance;
  transport: SessionClockTransport;
};

export type SessionClockBusRecord = {
  [K in keyof SessionClockBusEvents]: { type: K; payload: SessionClockBusEvents[K] };
}[keyof SessionClockBusEvents];

export type SessionClockBusHandler<K extends keyof SessionClockBusEvents> = (
  payload: SessionClockBusEvents[K],
) => void;

export type SessionClockBus = {
  on<K extends keyof SessionClockBusEvents>(type: K, handler: SessionClockBusHandler<K>): () => void;
  emit<K extends keyof SessionClockBusEvents>(type: K, payload: SessionClockBusEvents[K]): void;
  /** Detach all handlers. */
  clear(): void;
  /** Present when created with `{ record: true }`. */
  readonly records?: SessionClockBusRecord[];
};
