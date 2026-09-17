import type { PersonaDailyRhythm, PersonaDailyRhythmVariant } from './persona-daily-rhythm.js';

export type PersonaStatus = 'active' | 'placeholder';

/** Illustrative individual standing in for the persona — not a demographic boundary. */
export type PersonaExemplar = {
  name: string;
  age?: number;
  occupation?: string;
  location?: string;
  background?: string;
  /** Languages spoken (e.g. "English", "Spanish"). */
  languages?: string[];
  /** Household / living situation. */
  household?: string;
};

export type PersonaEmpathyPolarity = {
  positive: string[];
  negative: string[];
};

/**
 * Think / feel / say / do — situational voice on the persona (`src/domain/thinkfeel`).
 * Not skyline need boxes (`src/domain/skyline`).
 */
export type PersonaEmpathyMap = {
  think: string[];
  feel: PersonaEmpathyPolarity;
  say: PersonaEmpathyPolarity;
  do: string[];
};

export type Persona = {
  id: string;
  label: string;
  qualifier?: string;
  value?: string;
  primary?: boolean;
  role?: string;
  quote: string;
  who?: string;
  mindset?: string;
  /** How quickly this persona moves through a story episode (`slow` | `medium` | `fast`). */
  journeyPace?: 'slow' | 'medium' | 'fast';
  goals: string[];
  frustrations: string[];
  segment: string;
  status?: PersonaStatus;
  /** JTBD job ids this character cares about. */
  jobIds: string[];
  /** Percent of the customer base this persona represents (0…100). */
  share?: number;
  exemplar?: PersonaExemplar;
  empathy?: PersonaEmpathyMap;
  /** What makes this persona distinct — research takeaways, not goals. */
  insights?: string[];
  /** What loses this persona — barriers and churn risks. */
  watchouts?: string[];
  /** Preferred contact channels, most preferred first. */
  channels?: string[];
  /** Weekday home/work rhythm template — instances sample jittered copies. */
  dailyRhythm?: PersonaDailyRhythm;
  /** Weighted rhythm templates when a persona spans multiple realistic schedules. */
  dailyRhythmVariants?: PersonaDailyRhythmVariant[];
  /** One value per `strategy.attributes` def (`attr:*` → allowed slug). */
  attributes?: Record<string, string>;
  /** Personality / lifestyle traits (poster rail). */
  traits?: string[];
  hobbies?: string[];
  devices?: string[];
  /** Favorite apps / digital tools (poster rail). */
  apps?: string[];
  /** Product opportunities — “how we could help”. */
  opportunities?: string[];
  /**
   * @deprecated Thinking styles shift with context — set `Journey.thinkingStyleId` or
   * `Audience.thinkingStyleId` instead.
   */
  thinkingStyleIds?: string[];
};
