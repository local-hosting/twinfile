import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import {
  isViewerPlaceCardCatalogEntry,
  listViewerCatalog,
  listViewerPlaceCardCatalog,
} from '../viewer/dist/server/catalog/viewer-catalog.js';
import { testCatalogRoots } from '../../core/test/catalog-test-roots.js';

describe('viewer place catalog', () => {
  const testDir = dirname(fileURLToPath(import.meta.url));
  const { examplesRoot } = testCatalogRoots(testDir);
  const roots = { examplesRoots: [examplesRoot] };

  it('lists run presets only on the workbench catalog', () => {
    const all = listViewerCatalog(roots);
    const places = listViewerPlaceCardCatalog(roots);
    expect(places.length).toBeGreaterThan(0);
    expect(all.length).toBeGreaterThan(places.length);
    expect(all.some((e) => e.group === 'scenarios')).toBe(true);
    expect(places.every(isViewerPlaceCardCatalogEntry)).toBe(true);
    expect(places.every((e) => e.group === 'sites' && e.kind === 'place')).toBe(true);
    expect(
      places.some((e) => e.id.startsWith('scenarios/') || e.label.toLowerCase().includes('shelter at capacity')),
    ).toBe(false);
    const mobilityHubSites = places.filter((e) => e.id === 'mobility-hub' || e.id.startsWith('mobility-hub/'));
    expect(mobilityHubSites.map((e) => e.id).sort()).toEqual(['mobility-hub/campus']);
  });
});
