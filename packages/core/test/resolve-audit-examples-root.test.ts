import { mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { sceneAddress } from '../src/load/load-scene-run.js';
import { resolveAuditExamplesRoot, resolveTwinfilePackRoot } from '../src/paths/resolve-examples-root.js';

describe('resolveAuditExamplesRoot', () => {
  it('finds overlay pack root from a nested unit path via twin.local.yaml', () => {
    const packRoot = join(tmpdir(), `twin-pack-${Date.now()}`);
    const story = join(packRoot, 'story', 'visit-shim');
    mkdirSync(story, { recursive: true });
    writeFileSync(
      join(packRoot, 'twin.local.yaml'),
      `refs:
  twinfile/context/wireless-retail:0.1.0: context/wireless-retail
`,
    );
    writeFileSync(join(story, 'visit-shim.twin.yaml'), 'twinfile: 2\nkind: story\nid: visit-shim\n');

    const pack = resolveTwinfilePackRoot(story);
    expect(pack).toBe(packRoot);
    expect(resolveAuditExamplesRoot(story)).toBe(packRoot);
  });

  it('finds overlay pack root from a story#scene address', () => {
    const packRoot = join(tmpdir(), `twin-pack-scene-${Date.now()}`);
    const story = join(packRoot, 'story', 'visit-shim');
    mkdirSync(story, { recursive: true });
    writeFileSync(
      join(packRoot, 'twin.local.yaml'),
      `refs:
  twinfile/place/demo:0.1.0: place/demo
`,
    );
    writeFileSync(join(story, 'visit-shim.twin.yaml'), 'twinfile: 2\nkind: story\nid: visit-shim\n');

    const address = sceneAddress(story, 'round');
    expect(resolveTwinfilePackRoot(address)).toBe(packRoot);
    expect(resolveAuditExamplesRoot(address)).toBe(packRoot);
  });
});
