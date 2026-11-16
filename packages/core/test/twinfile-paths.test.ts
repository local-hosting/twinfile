import { describe, expect, it } from 'vitest';

import { normalizeManifestStack } from '../src/cli/format-twinfile.js';
import {
  twinfileBindingPaths,
  twinfileStackPaths,
  parseManifestLayerEntries,
} from '../src/load/twinfile-paths.js';

describe('manifest stack paths', () => {
  it('reads bindings from layers and orders them after place layers', () => {
    const twinfile = {
      layers: ['place/place.yaml', 'bindings/severe-weather.yaml', 'place/spaces.yaml'],
    };
    expect(twinfileBindingPaths(twinfile)).toEqual(['bindings/severe-weather.yaml']);
    expect(twinfileStackPaths(twinfile)).toEqual(twinfile.layers);
    expect(normalizeManifestStack(twinfile).layers).toEqual([
      'place/place.yaml',
      'place/spaces.yaml',
      'bindings/severe-weather.yaml',
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
