import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { buildTwinfile } from '@local-hosting/twinfile/place';
import { resolveAuditExamplesRoot, sceneAddress } from '@local-hosting/twinfile';
import { resolveAuditExamplesRoot as resolveAuditExamplesRootFromSrc } from '../../src/core/paths/resolve-examples-root.js';
import { resolveCatalogUnitRef } from '../../src/core/load/load-twin-head-unit.js';

import { testExamplesRoot } from '../helpers/catalog-test-roots.js';

const importDir = dirname(fileURLToPath(import.meta.url));
const placeCatalog = testExamplesRoot(importDir);

describe('overlay pack scene build', () => {
  it('buildTwinfile resolves overlay place refs via pack twin.local without explicit examplesRoot', async () => {
    const packRoot = join(tmpdir(), `twin-overlay-pack-${Date.now()}`);
    const placeDir = join(packRoot, 'place', 'demo-creek');
    const storyDir = join(packRoot, 'story', 'demo-ops');
    const eventDir = join(packRoot, 'event', 'demo-round');
    mkdirSync(placeDir, { recursive: true });
    mkdirSync(storyDir, { recursive: true });
    mkdirSync(eventDir, { recursive: true });

    writeFileSync(
      join(packRoot, 'twin.local.yaml'),
      `refs:
  twinfile/base-single-level:0.1.0: ${placeCatalog}/base-single-level
  twinfile/place/demo-creek:0.1.0: place/demo-creek
  twinfile/event/demo-round:1.0.0: event/demo-round
`,
    );

    writeFileSync(
      join(placeDir, 'demo-creek.twin.yaml'),
      `from: twinfile/base-single-level:0.1.0
twinfile: 2
kind: place
id: demo-creek
name: Demo creek
version: 0.1.0
stability: example
steps:
  - place:
      name: Demo creek
      kind: school
      timezone: UTC
      published: false
  - levels:
      - id: ground
        name: Ground
        ordinal: 0
  - spaces:
      - id: lab
        name: Lab
        kind: classroom
        level: ground
        exposure: indoor
  - stations:
      - id: sample-desk
        name: Sample desk
        roles:
          - survey-station
`,
    );

    writeFileSync(
      join(eventDir, 'demo-round.twin.yaml'),
      `twinfile: 1
kind: event
id: demo-round
name: Demo round
version: 1.0.0
stability: example
mode: daily
phases:
  - patrol
  - clear
expects:
  survey-station:
    kind: station
    min: 1
`,
    );

    writeFileSync(
      join(storyDir, 'demo-ops.twin.yaml'),
      `twinfile: 2
kind: story
id: demo-ops
name: Demo ops
version: 0.1.0
stability: example
mode: daily
links:
  - rel: involves
    href: twinfile/place/demo-creek:0.1.0
story:
  pitch: Overlay pack scene run.
  scenes:
    - id: creek-round
      label: Creek round
      run:
        from: twinfile/place/demo-creek:0.1.0
        steps:
          - copy: twinfile/event/demo-round:1.0.0
`,
    );

    const address = sceneAddress(storyDir, 'creek-round');
    expect(resolveAuditExamplesRoot(address)).toBe(packRoot);

    try {
      const built = await buildTwinfile(address, { writeLock: false });
      expect(built.ok).toBe(true);
      if (!built.ok) {
        expect(built.errors).toEqual([]);
        return;
      }
      expect(built.value.meta?.id).toBe('creek-round');
    } finally {
      rmSync(packRoot, { recursive: true, force: true });
    }
  });

  it('resolves overlay pack unit refs by kind/id layout without twin.local.yaml', () => {
    const packRoot = join(tmpdir(), `twin-overlay-pack-layout-${Date.now()}`);
    const placeDir = join(packRoot, 'place', 'demo-creek');
    const storyDir = join(packRoot, 'story', 'demo-ops');
    const eventDir = join(packRoot, 'event', 'demo-round');
    mkdirSync(placeDir, { recursive: true });
    mkdirSync(storyDir, { recursive: true });
    mkdirSync(eventDir, { recursive: true });

    writeFileSync(
      join(placeDir, 'demo-creek.twin.yaml'),
      `from: twinfile/base-single-level:0.1.0
twinfile: 2
kind: place
id: demo-creek
name: Demo creek
version: 0.1.0
stability: example
steps:
  - place:
      name: Demo creek
      kind: school
      timezone: UTC
      published: false
  - levels:
      - id: ground
        name: Ground
        ordinal: 0
  - spaces:
      - id: lab
        name: Lab
        kind: classroom
        level: ground
        exposure: indoor
  - stations:
      - id: sample-desk
        name: Sample desk
        roles:
          - survey-station
`,
    );

    writeFileSync(
      join(eventDir, 'demo-round.twin.yaml'),
      `twinfile: 1
kind: event
id: demo-round
name: Demo round
version: 1.0.0
stability: example
mode: daily
phases:
  - patrol
  - clear
expects:
  survey-station:
    kind: station
    min: 1
`,
    );

    writeFileSync(
      join(storyDir, 'demo-ops.twin.yaml'),
      `twinfile: 2
kind: story
id: demo-ops
name: Demo ops
version: 0.1.0
stability: example
mode: daily
links:
  - rel: involves
    href: twinfile/place/demo-creek:0.1.0
story:
  pitch: Overlay pack scene run.
  scenes:
    - id: creek-round
      label: Creek round
      run:
        from: twinfile/place/demo-creek:0.1.0
        steps:
          - copy: twinfile/event/demo-round:1.0.0
`,
    );

    expect(resolveAuditExamplesRootFromSrc(storyDir)).toBe(packRoot);

    const placeRef = resolveCatalogUnitRef('twinfile/place/demo-creek:0.1.0', {
      examplesRoot: packRoot,
    });
    if (!placeRef.ok) expect(placeRef.errors).toEqual([]);
    expect(placeRef.ok).toBe(true);

    const eventRef = resolveCatalogUnitRef('twinfile/event/demo-round:1.0.0', {
      examplesRoot: packRoot,
    });
    if (!eventRef.ok) expect(eventRef.errors).toEqual([]);
    expect(eventRef.ok).toBe(true);

    rmSync(packRoot, { recursive: true, force: true });
  });
});
