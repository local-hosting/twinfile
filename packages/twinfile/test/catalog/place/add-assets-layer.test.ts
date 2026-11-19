import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { parse as parseYaml } from 'yaml';
import { describe, expect, it } from 'vitest';

import { addAssetsLayerToPlace } from '@local-hosting/twinfile/cli';
import { initPlaceFromGeotype } from '../../../src/cli/init-place-from-geotype.js';
import { twinHeadPath } from '@local-hosting/twinfile';

describe('add assets layer', () => {
  it('appends an inline assets patch for v2 places', () => {
    const dir = mkdtempSync(join(tmpdir(), 'twin-add-assets-'));
    try {
      initPlaceFromGeotype(dir, {
        geotype: 'shopping_mall',
        geotypeRegistry: '@local-hosting/geotypes@0.2.0',
        unitName: 'decor-test',
        useFrom: true,
      });
      const result = addAssetsLayerToPlace(dir);
      expect(result.location).toMatch(/^steps\[\d+\]$/);
      const twinfile = parseYaml(readFileSync(twinHeadPath(dir), 'utf8')) as {
        steps: Array<Record<string, unknown>>;
      };
      expect(twinfile.steps.some((item) => 'assets' in item)).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
