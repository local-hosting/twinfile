import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

import {
  copyIntoAnchorsFromTwinfile,
  regionNavFromTwinfile,
  spacesFromTwinfileSteps,
} from '../src/place/region-nav.js';

const packageRoot = join(import.meta.dirname, '..');

function loadTwinfile(rel: string): Record<string, unknown> {
  return parse(readFileSync(join(packageRoot, rel), 'utf8')) as Record<string, unknown>;
}

describe('regionNavFromTwinfile', () => {
  it('lists park meadow and trailhead', () => {
    const rows = regionNavFromTwinfile(loadTwinfile('examples/park/park.twin.yaml'));
    expect(rows.map((r) => r.id).sort()).toEqual(['meadow', 'trailhead']);
  });

  it('omits copy anchors on campus twins', () => {
    const twinfile = loadTwinfile('examples/airport/airport.twin.yaml');
    const into = copyIntoAnchorsFromTwinfile(twinfile);
    expect(into.has('terminal-a')).toBe(true);
    const rows = regionNavFromTwinfile(twinfile);
    expect(rows.some((r) => r.id === 'terminal-a')).toBe(false);
  });

  it('reads spaces from manifest steps', () => {
    const twinfile = loadTwinfile('examples/park/park.twin.yaml');
    expect(spacesFromTwinfileSteps(twinfile).length).toBe(2);
  });
});
