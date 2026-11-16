import type { SampledPersonaDailyRhythm } from '../strategy/persona-daily-rhythm.js';

/** Scenario-specific slice of a PCM persona. */
export type PcmInstanceCharacteristics = {
  mindset?: string;
  traits?: readonly string[];
  voiceLine?: string;
  /** Jittered weekday home/work schedule for this instance. */
  dailyRhythm?: SampledPersonaDailyRhythm;
  /**
   * One sampled band per demographic framework (`age` → `55+`, `income` → …).
   * Drawn from `persona.demographic` or demographic research signals on this PCM.
   */
  demographics?: Readonly<Record<string, string>>;
};

export type PcmStoryInstance = {
  specVersion: '1.0';
  instanceId?: string;
  pcmId: string;
  segmentId: string;
  displayName: string;
  characteristics: PcmInstanceCharacteristics;
  createdAt: string;
};
