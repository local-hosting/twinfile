import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { placeAxesForSlug, placeDecorationsForSlug } from '@doppler-group/geotypes';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { parse as parseYaml } from 'yaml';

import { loadTwinfileStrict } from '../src/check/strict-place.js';
import { decoratePlaceFromGeotype } from '../src/cli/decorate-place-from-geotype.js';
import { initPlaceFromGeotype } from '../src/cli/init-place-from-geotype.js';
import { testCatalogRoots } from '../../../packages/core/test/catalog-test-roots.js';
import { twinHeadFileName, twinHeadPath } from '@doppler-group/twinfile-core';

const { examplesRoot, simulatorRoot } = testCatalogRoots(dirname(fileURLToPath(import.meta.url)));
const catalogOpts = { examplesRoot, simulatorRoot };

/** One geotype per archetype, plus a slug with no situations. */
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
      geotypeRegistry: '@doppler-group/geotypes@0.1.2',
      unitName: slug.replace(/_/g, '-'),
      useFrom: true,
    });

    const result = decoratePlaceFromGeotype(unitDir, slug, catalogOpts);

    const situations = placeDecorationsForSlug(slug)!.situations;
    expect(result.situationHints).toEqual(situations);
    const strict = loadTwinfileStrict(unitDir, catalogOpts);
    if (situations.length === 0) {
      expect(strict.ok, strict.ok ? '' : JSON.stringify(strict.errors)).toBe(true);
    }
  });

  it('references golden mixins as copy patches instead of copying stubs and plans', () => {
    const unitDir = join(dir, 'corner-shop');
    initPlaceFromGeotype(unitDir, {
      geotype: 'convenience_store',
      geotypeRegistry: '@doppler-group/geotypes@0.1.2',
      unitName: 'corner-shop',
      useFrom: true,
    });
    const result = decoratePlaceFromGeotype(unitDir, 'convenience_store', catalogOpts);
    expect(result.mixins).toEqual(['twinfile/mixin-assets:0.1.0']);
    expect(result.situationHints).toEqual(['severe-weather']);
    expect(existsSync(join(unitDir, 'plans'))).toBe(false);
    const twinfile = parseYaml(readFileSync(twinHeadPath(unitDir), 'utf8')) as {
      steps: Array<{ copy?: string; bind?: { for?: string } }>;
    };
    expect(twinfile.steps.flatMap((item) => (item.copy ? [item.copy] : []))).toEqual(result.mixins);
    expect(readdirSync(unitDir)).toEqual([twinHeadFileName(unitDir)]);
  });

  it('writes axes the archetype leaves open', () => {
    const unitDir = join(dir, 'hospital');
    initPlaceFromGeotype(unitDir, {
      geotype: 'hospital',
      geotypeRegistry: '@doppler-group/geotypes@0.1.2',
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
        geotypeRegistry: '@doppler-group/geotypes@0.1.2',
        unitName: 'stop-sign',
        useFrom: true,
      }),
    ).toThrow(/is an asset, not a place/);
  });
});
