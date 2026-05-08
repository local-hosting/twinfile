import { describe, expect, it } from 'vitest';

import { normalizeManifestStack } from '../src/cli/format-twinfile.js';
import {
  twinfileBindingPaths,
  twinfileStackPaths,
  parseManifestLayerEntries,
} from '../src/load/twinfile-paths.js';

describe('manifest stack paths', () => {
  it('merges legacy plans into layers list', () => {
    const twinfile = {
      layers: ['place/place.yaml', 'place/spaces.yaml'],
      plans: ['plans/severe-weather.yaml'],
    };
    expect(twinfileBindingPaths(twinfile)).toEqual(['plans/severe-weather.yaml']);
    expect(twinfileStackPaths(twinfile)).toEqual([
      'place/place.yaml',
      'place/spaces.yaml',
      'plans/severe-weather.yaml',
    ]);
    const normalized = normalizeManifestStack(twinfile);
    expect(normalized.plans).toBeUndefined();
    expect(normalized.layers).toEqual([
      'place/place.yaml',
      'place/spaces.yaml',
      'plans/severe-weather.yaml',
    ]);
  });

  it('parses replace mode entries', () => {
    const entries = parseManifestLayerEntries({
      layers: [{ path: 'place/spaces.yaml', mode: 'replace' }, 'place/openings.yaml'],
    });
    expect(entries).toHaveLength(2);
    expect(entries[0]?.mode).toBe('replace');
    expect(entries[1]?.mode).toBe('patch');
  });
});
