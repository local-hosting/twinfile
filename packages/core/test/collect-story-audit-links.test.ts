import { mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  collectStoryAuditLinks,
  storyAuditLinksIncludePlace,
} from '../src/views/audit/collect-story-audit-links.js';
import { readTwinHeadYaml, resolveCatalogUnitRef } from '../src/load/load-twin-head-unit.js';

describe('collectStoryAuditLinks', () => {
  it('inherits involves place from the from: parent story', () => {
    const pack = join(tmpdir(), `twin-from-links-${Date.now()}`);
    const baseDir = join(pack, 'base-visit');
    const shimDir = join(pack, 'shim-visit');
    const placeDir = join(pack, 'demo-place');
    mkdirSync(baseDir, { recursive: true });
    mkdirSync(shimDir, { recursive: true });
    mkdirSync(placeDir, { recursive: true });
    writeFileSync(
      join(placeDir, 'demo-place.twin.yaml'),
      `twinfile: 2
kind: place
id: demo-place
name: Demo place
version: 0.0.1
`,
    );
    writeFileSync(
      join(baseDir, 'base-visit.twin.yaml'),
      `twinfile: 2
kind: story
id: base-visit
name: Base visit
version: 0.0.1
links:
  - rel: involves
    href: twinfile/place/demo-place:0.0.1
story:
  pitch: Base
`,
    );
    writeFileSync(
      join(shimDir, 'shim-visit.twin.yaml'),
      `twinfile: 2
kind: story
id: shim-visit
name: Shim visit
version: 0.0.1
from: twinfile/story/base-visit:0.0.1
links:
  - rel: involves
    href: twinfile/character/wireless-greeter:0.1.0
`,
    );
    writeFileSync(
      join(pack, 'twin.local.yaml'),
      `refs:
  twinfile/story/base-visit:0.0.1: base-visit
  twinfile/place/demo-place:0.0.1: demo-place
`,
    );

    const loaded = readTwinHeadYaml(shimDir);
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;

    const options = { examplesRoot: pack };
    const links = collectStoryAuditLinks(loaded.value.doc, loaded.value, options);
    expect(links.some((link) => link.href.includes('demo-place'))).toBe(true);
    expect(
      storyAuditLinksIncludePlace(links, options, (unit) => {
        const resolved = resolveCatalogUnitRef(
          `twinfile/${unit.kind}/${String(unit.doc.id ?? '')}:0.0.1`,
          options,
        );
        return resolved.ok ? resolved.value.doc : unit.doc;
      }),
    ).toBe(true);
  });
});
