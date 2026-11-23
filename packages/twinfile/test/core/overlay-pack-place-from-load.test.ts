import { mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  catalogResolveOptions,
  loadTwinfile,
  resolveTwinfileByRef,
} from '@local-hosting/twinfile';
import { resolveTwinfileRoot, resolveTypeExamplesRoot } from '@local-hosting/twinfile';

describe('overlay pack place with monorepo from:', () => {
  it('loadTwinfile succeeds when inheriting a flat catalog base (place archetype hook)', () => {
    const packRoot = join(tmpdir(), `twin-overlay-from-${Date.now()}`);
    const unitRoot = join(packRoot, 'place', 'river-fork');
    mkdirSync(unitRoot, { recursive: true });
    writeFileSync(
      join(unitRoot, 'river-fork.twin.yaml'),
      `from: twinfile/base-linear:0.1.0
twinfile: 2
kind: place
id: river-fork
version: 0.1.0
stability: example
geotype:
  primary: creek
  registry: "@local-hosting/geotypes@0.2.0"
steps:
  - place:
      name: River fork overlay
      kind: creek
      timezone: UTC
      published: false
      location:
        lat: 35
        lng: -85
  - spaces:
      - id: reach-a
        name: Reach A
        kind: reach
        exposure: outdoor
        visit_order: 1
`,
    );

    const loaded = loadTwinfile(unitRoot);
    expect(loaded.ok, loaded.ok ? '' : JSON.stringify(loaded.errors)).toBe(true);
  });

  it('resolveTwinfileByRef finds monorepo base when examplesRoot is an overlay pack', () => {
    const packRoot = join(tmpdir(), `twin-overlay-ref-${Date.now()}`);
    mkdirSync(join(packRoot, 'story', 'stub'), { recursive: true });
    writeFileSync(join(packRoot, 'story', 'stub', 'stub.twin.yaml'), 'twinfile: 2\nkind: story\nid: stub\n');

    const base = resolveTwinfileByRef('twinfile/base-linear:0.1.0', catalogResolveOptions(packRoot));
    expect(base.ok, base.ok ? '' : JSON.stringify(base.errors)).toBe(true);
    if (base.ok) {
      const examples = resolveTypeExamplesRoot('place', resolveTwinfileRoot(packRoot));
      expect(base.value.loaded.root).toBe(join(examples, 'base-linear'));
    }
  });

  it('loadTwinfile still works after importing the package barrel', async () => {
    const packRoot = join(tmpdir(), `twin-barrel-${Date.now()}`);
    const unitRoot = join(packRoot, 'place', 'after-barrel');
    mkdirSync(unitRoot, { recursive: true });
    writeFileSync(
      join(unitRoot, 'after-barrel.twin.yaml'),
      `from: twinfile/base-linear:0.1.0
twinfile: 2
kind: place
id: after-barrel
version: 0.1.0
stability: example
geotype:
  primary: creek
  registry: "@local-hosting/geotypes@0.2.0"
steps:
  - place:
      name: After barrel
      kind: creek
      timezone: UTC
      published: false
      location:
        lat: 35
        lng: -85
  - spaces:
      - id: reach-a
        name: Reach A
        kind: reach
        exposure: outdoor
        visit_order: 1
`,
    );

    expect(loadTwinfile(unitRoot).ok).toBe(true);
    await import('@local-hosting/twinfile');
    expect(loadTwinfile(unitRoot).ok).toBe(true);
  });
});