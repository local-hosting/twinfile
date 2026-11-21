import { describe, expect, it } from 'vitest';

import {
  exportTwinfileToLoroMap,
  importTwinfileFromLoroMap,
  type TwinfileLoroMap,
} from '../src/index.js';

function memoryLoroMap(initial: Record<string, unknown> = {}): TwinfileLoroMap {
  const entries = new Map<string, unknown>(Object.entries(initial));
  return {
    get(key: string) {
      return entries.has(key) ? entries.get(key) : null;
    },
    set(key: string, value: unknown) {
      entries.set(key, value);
    },
    delete(key: string) {
      return entries.delete(key);
    },
    has(key: string) {
      return entries.has(key);
    },
    keys() {
      return [...entries.keys()];
    },
  };
}

describe('loro map import/export', () => {
  it('exports a twinfile object onto a host-passed map and imports it back', () => {
    const map = memoryLoroMap();
    exportTwinfileToLoroMap(map, {
      document: { id: 'persona:rider', version: 1, title: 'Rider', revision: 1 },
      persona: { id: 'persona:rider', label: 'Rider' },
      jobs: [{ id: 'job:commute' }],
      methodId: 'drop-me',
      emptyList: [],
    });

    expect(map.get('methodId')).toBeNull();
    expect(map.get('emptyList')).toBeNull();
    expect(map.get('document')).toEqual({
      id: 'persona:rider',
      version: 1,
      title: 'Rider',
      revision: 1,
    });
    expect(map.get('persona')).toEqual({ id: 'persona:rider', label: 'Rider' });
    expect(map.get('jobs')).toEqual([{ id: 'job:commute' }]);

    expect(importTwinfileFromLoroMap(map)).toEqual({
      document: { id: 'persona:rider', version: 1, title: 'Rider', revision: 1 },
      persona: { id: 'persona:rider', label: 'Rider' },
      jobs: [{ id: 'job:commute' }],
    });
  });

  it('removes stale top-level keys on export', () => {
    const map = memoryLoroMap({
      document: { id: 'old' },
      stale: { keep: false },
    });
    exportTwinfileToLoroMap(map, {
      document: { id: 'persona:rider', version: 1, title: 'Rider', revision: 1 },
      persona: { id: 'persona:rider', label: 'Rider' },
    });
    expect(map.has?.('stale')).toBe(false);
    expect(map.keys?.()).toEqual(['document', 'persona']);
  });

  it('rejects non-object export payloads', () => {
    const map = memoryLoroMap();
    expect(() => exportTwinfileToLoroMap(map, null)).toThrow(/plain object/);
    expect(() => exportTwinfileToLoroMap(map, [])).toThrow(/plain object/);
  });
});
