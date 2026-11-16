import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { placeScaffoldForSlug } from '@doppler-group/geotypes';
import { parse as parseYaml } from 'yaml';
import { describe, expect, it } from 'vitest';

import { initPlaceFromGeotype } from '../src/cli/init-place-from-geotype.js';
import { PLACE_DEMO_EXT_H3 } from '../src/place/demo-ext-h3.js';
import { placeBaseRefForArchetype } from '@doppler-group/twinfile-core';
import { twinHeadPath } from '@doppler-group/twinfile-core';

describe('initPlaceFromGeotype', () => {
  it('scaffolds a v2 place with geotype, scaffold, and from base', () => {
    const dir = mkdtempSync(join(tmpdir(), 'twin-init-'));
    try {
      initPlaceFromGeotype(dir, {
        geotype: 'shopping_mall',
        geotypeRegistry: '@doppler-group/geotypes@0.2.0',
        unitName: 'my-mall',
        useFrom: true,
      });

      const twinfile = parseYaml(readFileSync(twinHeadPath(dir), 'utf8')) as Record<
        string,
        unknown
      >;
      const scaffold = placeScaffoldForSlug('shopping_mall');
      expect(scaffold).not.toBeNull();
      expect(twinfile.twinfile).toBe(2);
      expect(twinfile.id).toBe('my-mall');
      expect(twinfile.from).toBe(placeBaseRefForArchetype(scaffold!.archetype));
      expect(twinfile.geotype).toEqual({
        primary: 'shopping_mall',
        registry: '@doppler-group/geotypes@0.2.0',
      });
      expect(twinfile.layers).toBeUndefined();
      const steps = twinfile.steps as Array<Record<string, unknown>>;
      const place = (steps[0]?.place ?? {}) as Record<string, unknown>;
      expect(place.archetype).toBeUndefined();
      expect(place.authoring_scale).toBeUndefined();
      expect(place.ext).toEqual({
        lat: 0,
        lon: 0,
        h3: PLACE_DEMO_EXT_H3[scaffold!.archetype],
      });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('writes parts/README.md hint for campus geotypes', () => {
    const dir = mkdtempSync(join(tmpdir(), 'twin-init-campus-'));
    try {
      initPlaceFromGeotype(dir, {
        geotype: 'university',
        geotypeRegistry: '@doppler-group/geotypes@0.2.0',
        unitName: 'campus-demo',
        useFrom: true,
      });
      const hint = readFileSync(join(dir, 'parts', 'README.md'), 'utf8');
      expect(hint).toContain('copy: ./parts/campus-demo-interior');
      expect(hint).toContain('into: campus-demo-building');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('omits parts README for indoor_stack geotypes', () => {
    const dir = mkdtempSync(join(tmpdir(), 'twin-init-mall-'));
    try {
      initPlaceFromGeotype(dir, {
        geotype: 'shopping_mall',
        geotypeRegistry: '@doppler-group/geotypes@0.2.0',
        unitName: 'my-mall',
        useFrom: true,
      });
      expect(() => readFileSync(join(dir, 'parts', 'README.md'), 'utf8')).toThrow();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('omits from when useFrom is false', () => {
    const dir = mkdtempSync(join(tmpdir(), 'twin-init-'));
    try {
      initPlaceFromGeotype(dir, {
        geotype: 'creek',
        geotypeRegistry: '@doppler-group/geotypes@0.2.0',
        unitName: 'creek-demo',
        useFrom: false,
      });
      const twinfile = parseYaml(readFileSync(twinHeadPath(dir), 'utf8')) as Record<
        string,
        unknown
      >;
      expect(twinfile.from).toBeUndefined();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
