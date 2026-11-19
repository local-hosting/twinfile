import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { exportPlace, importPlace } from '../../src/bridge/builtins/brick/index.js';
import { specRoot } from './spec-root.js';

function readSpec(rel: string): string {
  return readFileSync(join(specRoot(), rel), 'utf8');
}

describe('built-in brick', () => {
  it('imports and exports the brick-point conformance fixture', () => {
    const input = JSON.parse(readSpec('conf/map/brick-point.json')) as unknown;
    const imported = importPlace(input);
    const sensors = imported.place.sensors as Array<{ brick?: string; ext?: { timeseries?: string } }>;
    expect(sensors[0]?.ext?.timeseries).toBe('ts-9');
    expect(exportPlace(imported.place)).toBeDefined();
  });
});
