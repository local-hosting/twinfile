import type { TwinfileUseMode } from '@doppler-group/twinfile-core';

/** Scenario `clock:` — `starts_at` must carry an explicit UTC offset. */
export type ClockSpec = {
  starts_at: string;
  duration: string;
  step: string;
};

export type GeoLocation = {
  lat: number;
  lng: number;
};

export type Interpolation = 'linear' | 'step' | 'none';

export type CoverageMetric = 'served' | 'rssi_dbm';

export type TrackSource = 'solar' | 'curve' | 'feed' | 'schedule' | 'coverage';

export type TrackDef = {
  id: string;
  name?: string;
  source: TrackSource;
  unit?: string;
  interpolate?: Interpolation;
  /** `curve`: local time of day (`HH:MM`) → value. */
  points?: Record<string, number>;
  /** `feed`: sensor or gauge id and the property to read. */
  device?: string;
  property?: string;
  /** `schedule`: schedule id; the track reads `value` (default 1) while active, else 0. */
  schedule?: string;
  value?: number;
  /** `coverage`: network radio asset and target space. */
  radio?: string;
  space?: string;
  metric?: CoverageMetric;
  threshold_dbm?: number;
  profile?: string;
  engine?: string;
};

export type ScheduleUses = {
  space?: string;
  opening?: string;
  route?: string;
  marker?: string;
};

/** Gate a schedule window on a numeric track at the same instant (e.g. daylight elevation). */
export type ActiveWhenGate = {
  track: string;
  min?: number;
  max?: number;
};

export type ScheduleDef = {
  id: string;
  name?: string;
  when: string;
  uses?: ScheduleUses;
  variance?: { start: string };
  activeWhen?: ActiveWhenGate;
};

export type VisitDef = {
  id: string;
  kind: string;
  name?: string;
  space: string;
  order: number;
  /** Active while this schedule id is active (after gates). */
  during?: string;
};

export type Occupancy = {
  schedule: string;
  starts_at: string;
  ends_at: string;
} & ScheduleUses;

export type VisitBeatActive = {
  id: string;
  space: string;
  kind: string;
  schedule: string;
};

/** How a sensor or gauge obtains rows. `file` is a path; the others are pulled into `replay` before a run. */
export type FeedProtocol = 'file' | 'sensorthings' | 'ngsi-ld';

/** One JSON Lines feed record (`sensor.v1` field names, RFC 3339 times). */
export type FeedRow = {
  device_id: string;
  /** SOSA feature of interest, when the observation names what the device watches. */
  observes?: string;
  observed_property: string;
  value: number;
  unit?: string;
  observed_at: string;
  available_at?: string;
  quality?: string;
  /** Fields from an external mapping that have no feed column. */
  ext?: Record<string, unknown>;
};

export type PlaceTime = {
  tracks?: TrackDef[];
  schedules?: ScheduleDef[];
  visits?: VisitDef[];
};

export type ActiveSchedule = {
  id: string;
  uses?: ScheduleUses;
  starts_at: string;
  ends_at: string;
};

export type TimelineSample = {
  /** Seconds since `clock.starts_at`. */
  t: number;
  at: string;
  /** Summary layout id at `t` (always `place` — events arrive via session edges). */
  mode: TwinfileUseMode;
  /** What each track actually was at `t`. */
  tracks: Record<string, number | null>;
  /** What could be known at `t`: feed tracks only count readings already available. */
  known: Record<string, number | null>;
  active: ActiveSchedule[];
  /** Spaces (and related ids) in use by active schedules at `t`. */
  occupancy: Occupancy[];
  /** Visit beats tied to an active `during` schedule. */
  visit_beats: VisitBeatActive[];
};

/** Event phase id → seconds since `clock.starts_at`. */
export type PhaseStarts = Record<string, number>;

/** Event phase id → end `t` (seconds since `clock.starts_at`) from `*EndAt` scenario args. */
export type PhaseEnds = Record<string, number>;

/** Precomputed timeline sent to runners on stdin. */
export type TimelinePayload = {
  clock: ClockSpec;
  units: Record<string, string>;
  phaseStarts?: PhaseStarts;
  phaseEnds?: PhaseEnds;
  samples: TimelineSample[];
};
