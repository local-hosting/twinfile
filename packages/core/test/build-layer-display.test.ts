import { describe, expect, it } from 'vitest';

import { buildLayerDisplayLabel, summarizeBuildLayerRows } from '../src/build/build-layer-display.js';
import { listTwinfileManifestRecipe } from '../src/build/build-layer-manifest.js';
import { readYamlDocument } from '../src/validate/validate-yaml.js';
import { resolve } from 'node:path';

describe('build layer display', () => {
  it('summarizes copy import sublayers', () => {
    const rows = [
      { index: 7, ref: 'copy/concourse/patch/1/spaces', kind: 'copy', chain: 'a' },
      { index: 8, ref: 'copy/concourse/patch/2/openings', kind: 'copy', chain: 'b' },
      { index: 9, ref: 'copy/concourse/patch/3/routes', kind: 'copy', chain: 'c' },
      { index: 10, ref: 'copy/concourse/patch/4/assets', kind: 'copy', chain: 'd' },
    ];
    const summary = summarizeBuildLayerRows(rows);
    expect(summary).toHaveLength(1);
    expect(summary[0]!.ref).toBe('copy/concourse');
    expect(summary[0]!.imageLayerCount).toBe(4);
    expect(summary[0]!.detail).toHaveLength(4);
    expect(buildLayerDisplayLabel(summary[0]!)).toContain('4 image layers');
  });

  it('lists MSG arena manifest recipe with binds and copy', () => {
    const arenaRoot = resolve(import.meta.dirname, '../../../catalog/place/examples/arena');
    const twinfile = readYamlDocument(resolve(arenaRoot, 'Twinfile.yaml')).value as Record<string, unknown>;
    const recipe = listTwinfileManifestRecipe(twinfile);
    expect(recipe.from).toBe('twinfile/base-campus:0.1.0');
    expect(recipe.steps.map((s) => s.label)).toEqual([
      'Step 0 · place',
      'Step 1 · levels',
      'Step 2 · spaces',
      'Step 3 · openings',
      'Step 4 · routes',
      'Step 5 · assets',
      'Step 6 · bind · severe-weather',
      'Step 7 · bind · venue-turnstile-flow',
      'Step 8 · copy · ./parts/concourse → concourse',
    ]);
  });
});
