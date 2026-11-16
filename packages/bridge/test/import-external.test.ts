import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { exportExternal } from '../src/export-external.js';
import { geotypeSlugForMapping } from '../src/geotype-mapping.js';
import { importExternal } from '../src/import-external.js';
import { unmappedExt } from '../src/crosswalk.js';
import { resolveBridgeRef } from '../src/resolve-bridge.js';
import { specRoot } from './spec-root.js';

function readSpec(rel: string): string {
  return readFileSync(join(specRoot(), rel), 'utf8');
}

describe('external place mappings', () => {
  it('imports an IMDF venue that twin check accepts and keeps hours in ext', () => {
    const imported = importExternal('imdf', JSON.parse(readSpec('conf/map/imdf-venue.json')) as unknown);
    const site = imported.place.place as { ext?: { hours?: string; restriction?: string } };
    expect(site.ext?.hours).toBe('Mo-Su 09:00-17:00');
    expect(site.ext?.restriction).toBe('employeesonly');
    const openings = imported.place.openings as Array<{ kind?: string; roles?: string[]; ext?: { door?: { type?: string } } }>;
    expect(openings[0]?.ext?.door).toEqual({ type: 'swinging' });
    expect(openings.find((opening) => opening.kind === 'egress')?.roles).toEqual(['exit']);
    expect(imported.files['Twinfile.yaml']).toContain('primary: museum');
    expect(geotypeSlugForMapping('imdf', 'museum')).toBe('museum');
    expect(exportExternal('imdf', imported.place)['venue.json']).toContain('Mo-Su 09:00-17:00');
  });

  it('imports a GTFS stop file and one shape line that twin check accepts', () => {
    const imported = importExternal('gtfs', {
      stops: readSpec('conf/map/gtfs/stops.txt'),
      shapes: readSpec('conf/map/gtfs/shapes.txt'),
      pathways: readSpec('conf/map/gtfs/pathways.txt'),
    });
    const stations = imported.place.stations as Array<{ id: string; location?: { lat: number; lng: number }; ext?: { zone_id?: string; stop_lat?: string } }>;
    expect(stations).toHaveLength(1);
    expect(stations[0]).toMatchObject({ id: 'central', location: { lat: 40, lng: -73 }, ext: { zone_id: 'zone-a' } });
    expect(stations[0]?.ext?.stop_lat).toBeUndefined();
    const routes = imported.place.routes as Array<{ length_m: number; kind: string }>;
    expect(routes[0]).toMatchObject({ length_m: 1112, kind: 'corridor' });
    expect(imported.place.place).toMatchObject({ archetype: 'linear' });
    expect(geotypeSlugForMapping('gtfs', 'station')).toBe('train_station');
    expect(exportExternal('gtfs', imported.place)['stops.txt']).toContain('zone-a');
  });

  it('maps IndoorGML cellSpaces and transitions onto spaces, openings, and routes', () => {
    const imported = importExternal(
      'indoorgml',
      JSON.parse(readSpec('conf/map/indoorgml-building.json')) as unknown,
    );
    const spaces = imported.place.spaces as Array<{ id: string; roles?: string[]; ext?: { indoorgml?: { state?: string } } }>;
    expect(spaces.find((s) => s.id === 'entrance')?.roles).toContain('anchor');
    expect(spaces[0]?.ext?.indoorgml?.state).toBe('lobby-state');
    const openings = imported.place.openings as Array<{ connects: string[] }>;
    expect(openings.some((o) => o.connects.includes('lobby') && o.connects.includes('office-a'))).toBe(true);
    const routes = imported.place.routes as Array<{ length_m: number }>;
    expect(routes[0]?.length_m).toBe(18);
    expect(exportExternal('indoorgml', imported.place)['indoorgml.json']).toContain('"cellSpaces"');
  });

  it('maps Brick points and BOT storeys onto sensors, assets, levels, and spaces', () => {
    const brick = importExternal('brick', JSON.parse(readSpec('conf/map/brick-point.json')) as unknown);
    const sensors = brick.place.sensors as Array<{ brick?: string; ext?: { timeseries?: string } }>;
    const assets = brick.place.assets as Array<{ kind: string; brick?: string; ext?: { vendor?: string } }>;
    expect(sensors[0]?.ext?.timeseries).toBe('ts-9');
    expect(sensors[0]?.brick).toBe('https://brickschema.org/schema/Brick#Temperature_Sensor');
    expect(assets[0]).toMatchObject({
      kind: 'luminaire',
      brick: 'https://brickschema.org/schema/Brick#Luminaire',
      ext: { vendor: 'acme' },
    });
    const bot = importExternal('bot', JSON.parse(readSpec('conf/map/bot-storey.json')) as unknown);
    const spaces = bot.place.spaces as Array<{ level?: string; ext?: { usage?: string } }>;
    expect(bot.place.levels).toHaveLength(1);
    expect(spaces[0]).toMatchObject({ level: 's0', ext: { usage: 'office' } });
  });

  it('maps one SOSA observation onto a feed row and parks the rest in ext', () => {
    const imported = importExternal('sosa', JSON.parse(readSpec('conf/map/sosa-observation.json')) as unknown);
    expect(imported.feed).toMatchObject({
      device_id: 'sonde-eddy-pool',
      observes: 'eddy-pool',
      observed_property: 'turbidity',
      value: 48,
      unit: 'NTU',
      observed_at: '2026-06-12T14:00:00Z',
      available_at: '2026-06-12T15:00:00Z',
      ext: { wasAttributedTo: 'lab-tech' },
    });
    expect(imported.files['observation.jsonl']).toContain('lab-tech');
  });

  it('maps GTFS escalator and moving sidewalk pathway modes onto route kinds', () => {
    const imported = importExternal('gtfs', {
      stops: readSpec('conf/map/gtfs/stops.txt'),
      shapes: readSpec('conf/map/gtfs/shapes.txt'),
      pathways: readSpec('conf/map/gtfs/pathways-kinds.txt'),
    });
    const routes = imported.place.routes as Array<{ kind: string; step_free: boolean }>;
    expect(routes.map((route) => route.kind)).toEqual(['escalator', 'moving_sidewalk']);
    expect(routes.map((route) => route.step_free)).toEqual([false, true]);
    expect(() => unmappedExt('gtfs', 'stations', { stop_lat: '1' }, [])).toThrow(/stop_lat/);
  });

  it('scaffolds glTF geometry.ref via the gltf bridge', () => {
    const imported = importExternal('gltf', { path: 'sources/arena.glb', node: 'seats', name: 'Arena' });
    const spaces = imported.place.spaces as Array<{ geometry?: { ref: string } }>;
    expect(spaces[0]?.geometry?.ref).toBe('sources/arena.glb#seats');
    expect(resolveBridgeRef('gltf').roles).toContain('geometry');
  });

});
