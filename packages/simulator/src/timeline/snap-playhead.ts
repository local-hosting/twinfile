import type { SessionPlaybackMeta } from '../types/session-playback.js';

export function snapPlayheadT(t: number, meta: Pick<SessionPlaybackMeta, 'durationS' | 'stepS'>): number {
  const step = meta.stepS > 0 ? meta.stepS : 1;
  return Math.max(0, Math.min(meta.durationS, Math.round(t / step) * step));
}
