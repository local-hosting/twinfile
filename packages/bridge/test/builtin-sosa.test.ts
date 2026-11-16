import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { exportPlace, importPlace } from '../src/builtins/sosa/index.js';
import { specRoot } from './spec-root.js';

function readSpec(rel: string): string {
  return readFileSync(join(specRoot(), rel), 'utf8');
}

describe('built-in sosa', () => {
  it('imports and exports the sosa-observation conformance fixture', () => {
    const input = JSON.parse(readSpec('conf/map/sosa-observation.json')) as unknown;
    const imported = importPlace(input);
    expect(imported.feed).toMatchObject({
      device_id: 'sonde-eddy-pool',
      observed_property: 'turbidity',
      value: 48,
    });
    expect(exportPlace(imported.place, imported.feed)['observation.json']).toContain('lab-tech');
  });
});
