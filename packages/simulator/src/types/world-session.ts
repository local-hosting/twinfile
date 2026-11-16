import type { PhaseEnds, PhaseStarts, TimelineSample } from './twinfile-time.js';

/** Host playback cue derived from timeline samples (patch bus is host-owned). */
export type WorldSessionEdge =
  | { kind: 'schedule.start'; scheduleId: string }
  | { kind: 'schedule.end'; scheduleId: string }
  | { kind: 'phase.enter'; phase: string; t: number };

export type WorldSessionAdvance = {
  playheadT: number;
  sample: TimelineSample;
  edges: WorldSessionEdge[];
};

export type { PhaseStarts, PhaseEnds };
