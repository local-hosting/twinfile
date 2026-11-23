import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { placeAxesForSlug, placeDecorationsForSlug } from '@local-hosting/geotypes';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { parse as parseYaml } from 'yaml';

import { loadTwinfileStrict } from '../../../src/check/strict-place.js';
import { decoratePlaceFromGeotype } from '../../../src/cli/decorate-place-from-geotype.js';
import { initPlaceFromGeotype } from '../../../src/cli/init-place-from-geotype.js';
import { testCatalogRoots } from '../../helpers/catalog-test-roots.js';
import { twinHeadFileName, twinHeadPath } from '@local-hosting/twinfile';

const { examplesRoot } = testCatalogRoots(dirname(fileURLToPath(import.meta.url)));
const catalogOpts = { examplesRoot };

/** One geotype per archetype, plus a slug with no events. */
const SLUGS = ['convenience_store', 'hotel', 'stadium', 'public_park', 'creek', 'food_truck'];

describe('decoratePlaceFromGeotype', () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'twin-decorate-'));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it.each(SLUGS)('%s: base + stubs + plans pass strict checks', async (slug) => {
    const unitDir = join(dir, slug.replace(/_/g, '-'));
    initPlaceFromGeotype(unitDir, {
      geotype: slug,
      geotypeRegistry: '@local-hosting/geotypes@0.2.0',
      unitName: slug.replace(/_/g, '-'),
      useFrom: true,
    });

    const result = decoratePlaceFromGeotype(unitDir, slug, catalogOpts);

    const events = placeDecorationsForSlug(slug)!.events;
    expect(result.eventHints).toEqual(events);
    const strict = loadTwinfileStrict(unitDir, catalogOpts);
    if (events.length === 0) {
      expect(strict.ok, strict.ok ? '' : JSON.stringify(strict.errors)).toBe(true);
    }
  });

  it('writes starter rows as steps instead of copying stubs and plans', () => {
    const unitDir = join(dir, 'corner-shop');
    initPlaceFromGeotype(unitDir, {
      geotype: 'convenience_store',
      geotypeRegistry: '@local-hosting/geotypes@0.2.0',
      unitName: 'corner-shop',
      useFrom: true,
    });
    const result = decoratePlaceFromGeotype(unitDir, 'convenience_store', catalogOpts);
    expect(result.starterLayers).toEqual(['assets']);
    expect(result.eventHints).toEqual(['severe-weather']);
    expect(existsSync(join(unitDir, 'plans'))).toBe(false);
    const twinfile = parseYaml(readFileSync(twinHeadPath(unitDir), 'utf8')) as {
      steps: Array<{ copy?: string; assets?: Array<{ id: string }> }>;
    };
    expect(twinfile.steps.some((item) => item.copy?.includes('mixin'))).toBe(false);
    expect(twinfile.steps.flatMap((item) => item.assets ?? []).map((row) => row.id)).toEqual(['starter-kiosk']);
    expect(readdirSync(unitDir)).toEqual([twinHeadFileName(unitDir)]);
  });

  it('writes axes the archetype leaves open', () => {
    const unitDir = join(dir, 'hospital');
    initPlaceFromGeotype(unitDir, {
      geotype: 'hospital',
      geotypeRegistry: '@local-hosting/geotypes@0.2.0',
      unitName: 'hospital',
      useFrom: true,
    });
    const twinfile = parseYaml(readFileSync(twinHeadPath(unitDir), 'utf8')) as Record<string, unknown>;
    expect(twinfile.axes).toEqual({ vertical: placeAxesForSlug('hospital')!.vertical });
  });

  it('rejects point assets as places', () => {
    expect(() =>
      initPlaceFromGeotype(join(dir, 'stop-sign'), {
        geotype: 'stop_sign',
        geotypeRegistry: '@local-hosting/geotypes@0.2.0',
        unitName: 'stop-sign',
        useFrom: true,
      }),
    ).toThrow(/is an asset, not a place/);
  });
});
