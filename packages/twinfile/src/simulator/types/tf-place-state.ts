import type { Occupancy, TimelineSample } from './twinfile-time.js';
import type { WorldSessionEdge } from './world-session.js';

/** Active event programme phase at the playhead (from {@link TFWeather}). */
export type TFPlaceWeatherState = {
  id: string;
  phase?: string;
};

/**
 * Live read model for one {@link TFPlace} at playhead `t` —
 * timeline sample, weather phases, occupancy, and bus signals (after optional patch reactions).
 */
export type TFPlaceState = {
  /** Seconds since `clock.starts_at`. */
  t: number;
  at: string;
  sample: TimelineSample;
  weather: TFPlaceWeatherState[];
  /** Schedule / session signals derived from session edges (pre-patch). */
  signals: Record<string, unknown>;
  activeScheduleIds: string[];
  occupancy: Occupancy[];
  edges: WorldSessionEdge[];
};
