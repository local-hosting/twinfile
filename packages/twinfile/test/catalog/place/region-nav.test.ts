import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

import { twinHeadPath } from '@local-hosting/twinfile';
import { regionNavFromTwinfile, copyIntoAnchorsFromTwinfile, spacesFromTwinfileSteps } from '../../../src/catalog/place/place/region-nav.js';
import { testExamplesRoot } from '../../helpers/catalog-test-roots.js';

const examplesRoot = testExamplesRoot(dirname(fileURLToPath(import.meta.url)));

function loadTwinfile(unitSlug: string): Record<string, unknown> {
  const path = twinHeadPath(join(examplesRoot, unitSlug));
  return parse(readFileSync(path, 'utf8')) as Record<string, unknown>;
}

describe('regionNavFromTwinfile', () => {
  it('lists park meadow and trailhead', () => {
    const rows = regionNavFromTwinfile(loadTwinfile('park'));
    expect(rows.map((r) => r.id).sort()).toEqual(['meadow', 'ranger-shelter', 'trailhead']);
  });

  it('omits copy anchors on campus twins', () => {
    const twinfile = loadTwinfile('airport');
    const into = copyIntoAnchorsFromTwinfile(twinfile);
    expect(into.has('terminal-a')).toBe(true);
    const rows = regionNavFromTwinfile(twinfile);
    expect(rows.some((r) => r.id === 'terminal-a')).toBe(false);
  });

  it('reads spaces from manifest steps', () => {
    const twinfile = loadTwinfile('park');
    expect(spacesFromTwinfileSteps(twinfile).length).toBe(3);
  });
});