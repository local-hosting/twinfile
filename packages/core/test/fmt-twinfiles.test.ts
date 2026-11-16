import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { describe, expect, it } from 'vitest';
import { parse as parseYaml } from 'yaml';

import { formatTwinfilePath, twinfileYamlPaths } from '../src/cli/fmt-twinfiles.js';
import { twinHeadPath } from '../src/load/twinfile-locator.js';

describe('fmt-manifests', () => {
  it('formats a manifest file path and orders bindings after place layers', () => {
    const dir = mkdtempSync(join(tmpdir(), 'twin-fmt-'));
    const path = join(dir, 'place-arena.yaml');
    writeFileSync(
      path,
      `twinfile: 1
kind: place
id: arena
name: Arena
version: 1.0.0
layers:
  - bindings/severe-weather.yaml
  - place/spaces.yaml
`,
    );
    expect(formatTwinfilePath(path)).toBe(0);
    expect(twinfileYamlPaths(path, false)).toEqual([path]);
    const text = formatTwinfilePath(path, { check: true });
    expect(text).toBe(0);
    rmSync(dir, { recursive: true });
  });

  it('--upgrade=2 inlines layers, bindings, mixins, and buildings into patches', () => {
    const dir = mkdtempSync(join(tmpdir(), 'twin-fmt-upgrade-'));
    mkdirSync(join(dir, 'place'));
    mkdirSync(join(dir, 'bindings', 'site'), { recursive: true });
    writeFileSync(join(dir, 'place', 'place.yaml'), 'place:\n  name: Site\n');
    writeFileSync(join(dir, 'place', 'spaces.yaml'), 'spaces:\n  - id: hall\n');
    writeFileSync(join(dir, 'bindings', 'site', 'storm.yaml'), 'for: storm\n');
    const path = twinHeadPath(dir);
    writeFileSync(
      path,
      `twinfile: 1
kind: place
id: site
name: Site
version: 0.1.0
with: [twinfile/mixin-assets:0.1.0]
buildings:
  - id: hall
    from: ./buildings/hall
layers:
  - place/place.yaml
  - path: place/spaces.yaml
    mode: replace
  - bindings/site/storm.yaml
`,
    );
    expect(formatTwinfilePath(path, { upgrade: 2 })).toBe(0);
    const out = parseYaml(readFileSync(path, 'utf8')) as Record<string, unknown>;
    expect(out.twinfile).toBe(2);
    expect(out.layers).toBeUndefined();
    expect(out.with).toBeUndefined();
    expect(out.buildings).toBeUndefined();
    expect(out.steps).toEqual([
      { copy: 'twinfile/mixin-assets:0.1.0' },
      { place: { name: 'Site' } },
      { spaces: [{ id: 'hall' }], mode: 'replace' },
      { bind: { for: 'storm' } },
      { copy: './buildings/hall', into: 'hall' },
    ]);
    expect(existsSync(join(dir, 'place'))).toBe(false);
    expect(existsSync(join(dir, 'bindings'))).toBe(false);
    expect(formatTwinfilePath(path, { check: true })).toBe(0);
    rmSync(dir, { recursive: true });
  });

  it('--upgrade=2 converts scenario include to typed copy steps', () => {
    const dir = mkdtempSync(join(tmpdir(), 'twin-fmt-scenario-'));
    const path = twinHeadPath(dir);
    writeFileSync(
      path,
      `from: ..
twinfile: 1
kind: scenario
id: shop-shelter-at-cap
name: Shop Shelter At Cap
version: 1.0.0
stability: example
include:
  - twinfile/severe-weather:1.0.0
use:
  runner: npm:@twinfile/runner-hydraulic@^0
`,
    );
    expect(formatTwinfilePath(path, { upgrade: 2 })).toBe(0);
    const out = parseYaml(readFileSync(path, 'utf8')) as Record<string, unknown>;
    expect(out.twinfile).toBe(2);
    expect(out.include).toBeUndefined();
    expect(out.steps).toEqual([{ copy: 'twinfile/situation/severe-weather:1.0.0' }]);
    rmSync(dir, { recursive: true });
  });

  it('finds manifests recursively under a tree', () => {
    const dir = mkdtempSync(join(tmpdir(), 'twin-fmt-tree-'));
    mkdirSync(join(dir, 'nested'), { recursive: true });
    writeFileSync(
      twinHeadPath(join(dir, 'nested')),
      'twinfile: 1\nkind: place\nname: x\nversion: 0.1.0\nlayers: []\n',
    );
    const found = twinfileYamlPaths(dir, true);
    expect(found).toHaveLength(1);
    rmSync(dir, { recursive: true });
  });
});
