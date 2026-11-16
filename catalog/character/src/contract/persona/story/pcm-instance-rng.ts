import Chance from 'chance';

type PcmInstanceChance = InstanceType<typeof Chance>;

export type PcmInstanceRandomSource = {
  /** Injectable PRNG (tests); takes precedence over {@link seed}. */
  random?: () => number;
  /** Reproducible sampling via Chance.js when `random` is omitted. */
  seed?: string | number;
};

/** Chance instance for PCM story-instance materialization. */
export function createPcmInstanceChance(seed?: string | number): PcmInstanceChance {
  if (seed === undefined) {
    return new Chance();
  }
  return new Chance(seed);
}

/** `0 <= n < 1` sampler backed by Chance (stable across PCM pick helpers). */
export function pcmInstanceRandomFromChance(chance: PcmInstanceChance): () => number {
  return () => chance.floating({ min: 0, max: 1, fixed: 10 });
}

/** Resolve the RNG used by `materializePcmStoryInstance` and `pickPcmInstanceCharacteristics`. */
export function resolvePcmInstanceRandom(source?: PcmInstanceRandomSource): () => number {
  if (source?.random) {
    return source.random;
  }
  if (source?.seed !== undefined) {
    return pcmInstanceRandomFromChance(createPcmInstanceChance(source.seed));
  }
  return Math.random;
}
