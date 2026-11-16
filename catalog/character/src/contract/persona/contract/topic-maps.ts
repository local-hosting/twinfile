/** Character on-disk topic folders → in-memory keys. */
export const CHARACTER_STRATEGY_TOPIC_MAP = {
  jobs: 'jobs',
  /** @deprecated Prefer `jobs/` — maps into jobs. */
  needs: 'jobs',
  'mental-models': 'mentalModels',
  'thinking-styles': 'thinkingStyles',
  dimensions: 'dimensions',
  attributes: 'attributes',
  audiences: 'audiences',
  obstacles: 'obstacles',
  signals: 'signals',
} as const;

export const CHARACTER_STORY_TOPIC_MAP = {
  journeys: 'journeys',
  quotes: 'quotes',
} as const;
