import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { loadTwinfile } from '@local-hosting/twinfile';
import { buildLayoutSummary, formatLayoutSummaryText } from '../../../src/catalog/place/card/layout-summary.js';
import { testExamplesRoot } from '../../../helpers/catalog-test-roots.js';

const examplesRoot = testExamplesRoot(dirname(fileURLToPath(import.meta.url)));

describe('layout summary', () => {
  it('summarizes expo with layout_index and parent links', () => {
    const loaded = loadTwinfile(join(examplesRoot, 'expo'));
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    const summary = buildLayoutSummary(loaded.value);
    expect(summary.spaces.total).toBeGreaterThan(10);
    expect(summary.spaces.withParent).toBe(5);
    expect(summary.layoutIndex?.regions.length).toBeGreaterThan(3);
    expect(summary.visits.length).toBeGreaterThan(0);
    const text = formatLayoutSummaryText(summary);
    expect(text).toContain('layout_index');
    expect(text).toContain('pavilion-opportunity');
  });

  it('summarizes airport layout_index', () => {
    const loaded = loadTwinfile(join(examplesRoot, 'airport'));
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    const summary = buildLayoutSummary(loaded.value);
    expect(summary.layoutIndex?.regions.map((r) => r.id)).toContain('landside');
  });
});
