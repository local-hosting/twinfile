import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { bridge, exportPlace, importPlace } from '../src/builtins/imdf/index.js';
import { specRoot } from './spec-root.js';
import { TWIN_HEAD_SUFFIX } from '../src/place-kit.js';

function readSpec(rel: string): string {
  return readFileSync(join(specRoot(), rel), 'utf8');
}

describe('built-in imdf', () => {
  it('imports and exports the imdf-venue conformance fixture', () => {
    const input = JSON.parse(readSpec('conf/map/imdf-venue.json')) as unknown;
    const imported = importPlace(input);
    const site = imported.place.place as { ext?: { hours?: string; restriction?: string } };
    expect(site.ext?.hours).toBe('Mo-Su 09:00-17:00');
    expect(site.ext?.restriction).toBe('employeesonly');
    expect(Object.entries(imported.files).find(([rel]) => rel.endsWith(TWIN_HEAD_SUFFIX))?.[1]).toContain('primary: museum');
    expect(exportPlace(imported.place)['venue.json']).toContain('Mo-Su 09:00-17:00');
    expect(bridge.crosswalkSource).toBe('imdf');
  });
});
