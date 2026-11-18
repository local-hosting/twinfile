import * as ChanceNamespace from 'chance';

export type ChanceLike = {
  floating: (opts: { min: number; max: number; fixed: number }) => number;
};

export type ChanceCtor = new (seed?: string | number) => ChanceLike;

function asCtor(value: unknown): ChanceCtor | null {
  return typeof value === 'function' ? (value as ChanceCtor) : null;
}

/**
 * Chance ships as CJS/UMD (`module.exports = Chance`). Vite may serve it without a
 * synthesized default when twinfile is optimizeDeps-excluded — use namespace import
 * plus ctor resolution on the browser surface.
 */
export function loadChanceCtor(): ChanceCtor {
  const ns = ChanceNamespace as unknown as {
    default?: unknown;
    Chance?: unknown;
  };
  const fromModule =
    asCtor(ChanceNamespace) ?? asCtor(ns.default) ?? asCtor(ns.Chance);
  if (fromModule) return fromModule;

  const fromGlobal = asCtor((globalThis as { Chance?: unknown }).Chance);
  if (fromGlobal) return fromGlobal;

  throw new Error('chance: constructor export not found');
}
