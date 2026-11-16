/** Canonical blocks in a weekday home/work rhythm template. */
export const PERSONA_DAILY_BLOCK_IDS = [
  'wake',
  'home_morning',
  'commute_out',
  'work',
  'midday_break',
  'commute_home',
  'home_evening',
  'sleep',
] as const;

export type PersonaDailyBlockId = (typeof PERSONA_DAILY_BLOCK_IDS)[number];

export type PersonaDailyRhythmSetting = 'home' | 'work' | 'transit' | 'other';

/** One slice of a persona's typical weekday (local wall clock). */
export type PersonaDailyRhythmBlock = {
  id: PersonaDailyBlockId;
  label: string;
  /** Local hour 0–23. */
  startHour: number;
  /** 0–59; default 0. */
  startMinute?: number;
  endHour?: number;
  endMinute?: number;
  setting: PersonaDailyRhythmSetting;
  notes?: string;
};

/**
 * Persona-level weekday rhythm — authored on Character before instance materialization.
 * Hosts jitter blocks per story instance (see {@link samplePersonaDailyRhythm}).
 */
export type PersonaDailyRhythm = {
  specVersion: '1.0';
  label?: string;
  timezone?: string;
  weekday: PersonaDailyRhythmBlock[];
  /** Optional weekend template (same block ids). */
  weekend?: PersonaDailyRhythmBlock[];
  /** Max minutes to shift block starts at materialize time (default 25). */
  jitterMinutes?: number;
};

/** Weighted weekday template — one picked per materialized instance. */
export type PersonaDailyRhythmVariant = {
  id: string;
  label?: string;
  /** Relative weight (default 1). */
  weight?: number;
  weekday: PersonaDailyRhythmBlock[];
  weekend?: PersonaDailyRhythmBlock[];
  jitterMinutes?: number;
};

/** Materialized rhythm on a story instance (after jitter). */
export type SampledPersonaDailyRhythm = {
  specVersion: '1.0';
  label?: string;
  timezone?: string;
  weekday: PersonaDailyRhythmBlock[];
  weekend?: PersonaDailyRhythmBlock[];
  sourceTemplateLabel?: string;
  sourceVariantId?: string;
};
