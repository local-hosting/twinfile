import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { exportPlace, importPlace } from '../../src/bridge/builtins/gtfs/index.js';
import { specRoot } from './spec-root.js';

function readSpec(rel: string): string {
  return readFileSync(join(specRoot(), rel), 'utf8');
}

describe('built-in gtfs', () => {
  it('imports and exports the gtfs-line conformance fixture', () => {
    const imported = importPlace({
      stops: readSpec('conf/map/gtfs/stops.txt'),
      shapes: readSpec('conf/map/gtfs/shapes.txt'),
      pathways: readSpec('conf/map/gtfs/pathways.txt'),
    });
    const stations = imported.place.stations as Array<{
      id: string;
      location?: { lat: number; lng: number };
      ext?: { zone_id?: string };
    }>;
    expect(stations).toHaveLength(1);
    expect(stations[0]).toMatchObject({ id: 'central', location: { lat: 40, lng: -73 }, ext: { zone_id: 'zone-a' } });
    expect(imported.place.place).toMatchObject({ archetype: 'linear' });
    expect(exportPlace(imported.place)['stops.txt']).toContain('zone-a');
  });
});
