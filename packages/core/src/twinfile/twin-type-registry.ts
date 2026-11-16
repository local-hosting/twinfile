import { err, ok } from '../types/twin-error.js';
import type { TwinKind } from '../types/twin-kind.js';
import type { AnyTwinTypeModule, TwinTypeRegistry } from '../types/twin-type-module.js';

/** Lookup from twin kind to its type module; callers register modules since core cannot import type packages. */
export function createTwinTypeRegistry(modules: readonly AnyTwinTypeModule[]): TwinTypeRegistry {
  const byKind = new Map<TwinKind, AnyTwinTypeModule>();
  for (const module of modules) {
    if (byKind.has(module.kind)) throw new Error(`duplicate twin type module for kind: ${module.kind}`);
    byKind.set(module.kind, module);
  }

  return {
    getOne: (kind) => {
      const module = byKind.get(kind);
      return module
        ? ok(module)
        : err([{ code: 'E_BUILD', message: `no twin type module registered for kind: ${kind}` }]);
    },
    getAll: () => [...byKind.values()],
  };
}
