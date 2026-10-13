import { loadChanceCtor, type ChanceLike } from './load-chance-ctor.js';

type PcmInstanceChance = ChanceLike;

export type CharacterInstanceRandomSource = {
  /** Injectable PRNG (tests); takes precedence over {@link seed}. */
  random?: () => number;
  /** Reproducible sampling via Chance.js when `random` is omitted. */
  seed?: string | number;
};

/** Chance instance for Character story-instance materialization. */
export function createCharacterInstanceChance(seed?: string | number): PcmInstanceChance {
  const Chance = loadChanceCtor();
  if (seed === undefined) {
    return new Chance();
  }
  return new Chance(seed);
}

/** `0 <= n < 1` sampler backed by Chance (stable across Character pick helpers). */
export function characterInstanceRandomFromChance(chance: PcmInstanceChance): () => number {
  return () => chance.floating({ min: 0, max: 1, fixed: 10 });
}

/** Resolve the RNG used by `materializeCharacterStoryInstance` and `pickCharacterInstanceCharacteristics`. */
export function resolveCharacterInstanceRandom(source?: CharacterInstanceRandomSource): () => number {
  if (source?.random) {
    return source.random;
  }
  if (source?.seed !== undefined) {
    return characterInstanceRandomFromChance(createCharacterInstanceChance(source.seed));
  }
  return Math.random;
}
