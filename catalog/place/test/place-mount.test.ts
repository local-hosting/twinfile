import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { parsePlacesCatalogUri, resolvePlaceMount, resolvePlacesCatalog } from '../src/place/place-mount.js';
import { testExamplesRoot } from '../../../packages/core/test/catalog-test-roots.js';

const examplesRoot = testExamplesRoot(dirname(fileURLToPath(import.meta.url)));

describe('parsePlacesCatalogUri', () => {
  it('parses file path catalog', () => {
    const parsed = parsePlacesCatalogUri(examplesRoot);
    expect(parsed.kind).toBe('file');
    if (parsed.kind === 'file') {
      expect(parsed.rootDir).toContain('examples');
    }
  });

  it('parses oci catalog', () => {
    expect(parsePlacesCatalogUri('oci://ghcr.io/doppler-group/twinfile')).toEqual({
      kind: 'oci',
      registry: 'ghcr.io',
      repositoryPrefix: 'doppler-group/twinfile',
    });
  });
});

describe('resolvePlaceMount with catalog URI', () => {
  it('loads shop via file catalog uri', () => {
    const mount = resolvePlaceMount('twinfile/shop:0.2.0', {
      placesCatalogUri: `file://${examplesRoot}`,
    });
    expect(mount.venueKey).toBe('venue:shop');
    expect(mount.layoutSpaces?.length).toBeGreaterThan(0);
  });

  it('loads expo visit moments via file catalog uri', () => {
    const mount = resolvePlaceMount('twinfile/expo:0.2.0', {
      placesCatalogUri: `file://${examplesRoot}`,
    });
    expect(mount.visitMomentIds?.length).toBeGreaterThan(0);
  });

  it('resolvePlacesCatalog prefers explicit uri', () => {
    const catalog = resolvePlacesCatalog({
      placesCatalogUri: `file://${examplesRoot}`,
    });
    expect(catalog?.kind).toBe('file');
  });
});
