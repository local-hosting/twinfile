import { loadChanceCtor, type ChanceLike } from './load-chance-ctor.js';

type StoryPlanChance = ChanceLike;

export type StoryPlanRandomSource = {
  /** Injectable PRNG (tests); takes precedence over {@link seed}. */
  random?: () => number;
  /** Reproducible combos via Chance.js when `random` is omitted. */
  seed?: string | number;
};

/** Chance instance for story-plan sampling (segment/store/intent combos). */
export function createStoryPlanChance(seed?: string | number): StoryPlanChance {
  const Chance = loadChanceCtor();
  if (seed === undefined) {
    return new Chance();
  }
  return new Chance(seed);
}

/** `0 <= n < 1` sampler backed by Chance (stable across Story pick helpers). */
export function storyPlanRandomFromChance(chance: StoryPlanChance): () => number {
  return () => chance.floating({ min: 0, max: 1, fixed: 10 });
}

/** Resolve the RNG used by story-plan heuristics and catalog picks. */
export function resolveStoryPlanRandom(source?: StoryPlanRandomSource): () => number {
  if (source?.random) {
    return source.random;
  }
  if (source?.seed !== undefined) {
    return storyPlanRandomFromChance(createStoryPlanChance(source.seed));
  }
  return Math.random;
}
