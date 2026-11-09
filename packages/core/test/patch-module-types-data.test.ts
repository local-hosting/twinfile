import { describe, expect, it } from 'vitest';

import {
  PATCH_MODULE_TYPE_IDS,
  PATCH_WIRES,
  isPatchWire,
} from '../src/generated/patch-module-types-data.js';
import { loadPatchModuleTypeCatalog } from '../src/patch/module-type-catalog.js';

describe('patch-module-types-data', () => {
  it('matches live catalog wires and module types', () => {
    const catalog = loadPatchModuleTypeCatalog();
    const typeIds = Object.keys(catalog).sort();
    expect(typeIds).toEqual([...PATCH_MODULE_TYPE_IDS]);
    const wires = new Set<string>();
    for (const def of Object.values(catalog)) {
      for (const port of Object.values(def.ports)) {
        wires.add(port.wire);
        expect(isPatchWire(port.wire)).toBe(true);
      }
    }
    expect([...wires].sort()).toEqual([...PATCH_WIRES]);
  });
});
