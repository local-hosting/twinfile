import { createRequire } from 'node:module';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { loadTwinfile, validateTwinfileYamlPath, validatePlaceYamlPath } from '../src/load/load-twinfile.js';
import { testExamplesRoot } from './catalog-test-roots.js';

const require = createRequire(import.meta.url);
const specConf = join(dirname(require.resolve('@doppler-group/twinfile-spec/package.json')), 'conf');
const examplesRoot = testExamplesRoot(dirname(fileURLToPath(import.meta.url)));

describe('validateTwinfileYamlPath', () => {
  it('accepts schema-ok place-shop manifest', () => {
    const path = join(specConf, 'schema/ok/twinfile/place/place-shop.yaml');
    const result = validateTwinfileYamlPath(path);
    expect(result.ok).toBe(true);
  });

  it('rejects bad semver', () => {
    const path = join(specConf, 'schema/bad/twinfile/place/place-bad-semver.yaml');
    const result = validateTwinfileYamlPath(path);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.code === 'E_SCHEMA')).toBe(true);
    }
  });
});

describe('validatePlaceYamlPath', () => {
  it('accepts place-root conf vector', () => {
    const path = join(specConf, 'schema/ok/place/base/place-root.yaml');
    expect(validatePlaceYamlPath(path).ok).toBe(true);
  });

  it('rejects empty spaces file', () => {
    const path = join(specConf, 'schema/bad/place/base/empty.yaml');
    expect(validatePlaceYamlPath(path).ok).toBe(false);
  });
});

describe('loadTwinfile', () => {
  it('loads a minimal place unit directory', () => {
    const root = mkdtempSync(join(tmpdir(), 'twinfile-unit-'));
    writeFileSync(
      join(root, 'twinfile.yaml'),
      `twinfile: 1
kind: place
id: demo
name: Demo
version: 1.0.0
stability: example
layers:
  - place/place.yaml
  - place/spaces.yaml
`,
    );
    mkdirSync(join(root, 'place'), { recursive: true });
    writeFileSync(
      join(root, 'place/place.yaml'),
      `place:
  name: Demo
  kind: shop
  timezone: UTC
`,
    );
    writeFileSync(
      join(root, 'place/spaces.yaml'),
      `spaces:
  - id: lobby
    kind: zone
`,
    );

    const result = loadTwinfile(root);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.twinfile.id).toBe('demo');
    }
  });

  it('rejects scenario Twinfile.yaml (runs use scene run.yaml)', () => {
    const result = loadTwinfile(
      resolve(examplesRoot, '../../../catalog/story/examples/shop-visit/scenes/shop-shelter-at-cap'),
    );
    expect(result.ok).toBe(false);
  });

  it('rejects unknown top-level files', () => {
    const root = mkdtempSync(join(tmpdir(), 'twinfile-unit-'));
    writeFileSync(
      join(root, 'twinfile.yaml'),
      `twinfile: 1
kind: place
id: demo
name: Demo
version: 1.0.0
stability: example
layers:
  - place/place.yaml
`,
    );
    mkdirSync(join(root, 'place'), { recursive: true });
    writeFileSync(
      join(root, 'place/place.yaml'),
      `place:
  name: Demo
  kind: shop
  timezone: UTC
`,
    );
    writeFileSync(join(root, 'stray.yml'), 'foo: bar\n');

    const result = loadTwinfile(root);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.code === 'E_UNKNOWN_FILE')).toBe(true);
    }
  });

  it('accepts place markers layer (spec conf vector)', () => {
    const path = join(specConf, 'schema/ok/place/nat/place-markers.yaml');
    expect(validatePlaceYamlPath(path).ok).toBe(true);
  });

  it('loads examples/arena place', () => {
    const result = loadTwinfile(join(examplesRoot, 'arena'));
    expect(result.ok).toBe(true);
  });

  it('loads mobility-hub instance with nested instances/ and programme/ siblings', () => {
    const result = loadTwinfile(join(examplesRoot, 'mobility-hub'));
    expect(result.ok).toBe(true);
  });

  it('accepts twinfile 2 patches: alias (normalized to steps:)', () => {
    const root = mkdtempSync(join(tmpdir(), 'twinfile-patches-'));
    writeFileSync(
      join(root, 'twinfile.yaml'),
      `twinfile: 2
kind: place
id: demo
name: Demo
version: 0.1.0
stability: example
patches:
  - place:
      name: Demo
      kind: shop
      timezone: UTC
`,
    );
    const result = loadTwinfile(root);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(Array.isArray(result.value.twinfile.steps)).toBe(true);
      expect(result.value.twinfile).not.toHaveProperty('patches');
    }
  });
});
