import { mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { buildTwinfileAudit } from '../src/views/audit/build-twinfile-audit.js';
import { formatTwinfileAuditMarkdown } from '../src/views/audit/format-twinfile-audit-markdown.js';
import { readTwinHeadYaml } from '../src/load/load-twin-head-unit.js';
import { testCatalogRoots } from './catalog-test-roots.js';
import { resolveTypeExamplesRoot } from '../src/paths/catalog-layout.js';
import { resolveTwinfileRoot } from '../src/paths/catalog-layout.js';

const { examplesRoot } = testCatalogRoots(dirname(fileURLToPath(import.meta.url)));

function storyExampleDir(slug: string): string {
  const twinfileRoot = resolveTwinfileRoot(examplesRoot);
  return join(resolveTypeExamplesRoot('story', twinfileRoot), slug);
}

function resourceExampleDir(slug: string): string {
  const twinfileRoot = resolveTwinfileRoot(examplesRoot);
  return join(resolveTypeExamplesRoot('resource', twinfileRoot), slug);
}

describe('buildTwinfileAudit', () => {
  it('expands a catalog story graph into lenses', () => {
    const loaded = readTwinHeadYaml(storyExampleDir('wireless-visit'));
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;

    const built = buildTwinfileAudit(loaded.value, { examplesRoot });
    expect(built.ok).toBe(true);
    if (!built.ok) return;

    const card = built.value;
    expect(card.schema).toBe('twinfile.audit.v1');
    expect(card.header.id).toBe('wireless-visit');
    expect(card.lenses.motive.some((row) => row.id === 'pitch')).toBe(true);
    expect(card.lenses.path.length).toBeGreaterThanOrEqual(4);
    expect(card.lenses.stage.some((row) => row.id === 'wireless-mobile')).toBe(true);
    expect(card.lenses.cast.length).toBeGreaterThanOrEqual(1);
    expect(card.findings.some((f) => f.code === 'STORY_NO_PLACE')).toBe(false);
    expect(card.findings.some((f) => f.code === 'STORY_NO_CHARACTER')).toBe(false);

    const md = formatTwinfileAuditMarkdown(card);
    expect(md).toContain('## Cast');
    expect(md).toContain('## Path');
    expect(md).toContain('not schema validation');
  });

  it('confirms resource locatedIn anchor on place', () => {
    const loaded = readTwinHeadYaml(resourceExampleDir('greeter-kiosk'));
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;

    const built = buildTwinfileAudit(loaded.value, { examplesRoot });
    expect(built.ok).toBe(true);
    if (!built.ok) return;

    expect(built.value.findings.some((f) => f.code === 'ANCHOR_MISSING')).toBe(false);
    expect(built.value.lenses.props.some((row) => row.id === 'greeter-kiosk')).toBe(true);
  });

  it('surfaces story bless bindings on the bless lens', () => {
    const root = join(tmpdir(), `twin-audit-bless-${Date.now()}`, 'bless-visit');
    mkdirSync(root, { recursive: true });
    writeFileSync(
      join(root, 'bless-visit.twin.yaml'),
      `twinfile: 2
kind: story
id: bless-visit
name: Bless visit
version: 0.0.1
links:
  - rel: involves
    href: twinfile/place/wireless-mobile:0.1.0
  - rel: involves
    href: twinfile/character/wireless-greeter:0.1.0
  - rel: involves
    href: twinfile/context/wireless-retail:0.1.0
steps:
  - story:
      bless:
        - character: twinfile/character/wireless-greeter:0.1.0
          context: twinfile/context/wireless-retail:0.1.0
story:
  pitch: Bless
  scenes:
    - id: one
      label: One
`,
    );

    const loaded = readTwinHeadYaml(root);
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;

    const built = buildTwinfileAudit(loaded.value, { examplesRoot });
    expect(built.ok).toBe(true);
    if (!built.ok) return;

    expect(built.value.findings.some((f) => f.code === 'STORY_NO_PLACE')).toBe(false);
    expect(built.value.lenses.bless.length).toBeGreaterThan(0);
  });

  it('reports unresolved links as gaps', () => {
    const root = join(tmpdir(), `twin-audit-${Date.now()}`, 'broken-story');
    mkdirSync(root, { recursive: true });
    const path = join(root, 'broken-story.twin.yaml');
    writeFileSync(
      path,
      `twinfile: 2
kind: story
id: broken-story
name: Broken story
version: 0.0.1
links:
  - rel: involves
    href: twinfile/place/does-not-exist:9.9.9
story:
  pitch: Test
  scenes:
    - id: one
      label: One
`,
    );
    const loaded = readTwinHeadYaml(root);
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;

    const built = buildTwinfileAudit(loaded.value, { examplesRoot });
    expect(built.ok).toBe(true);
    if (!built.ok) return;

    expect(built.value.findings.some((f) => f.code === 'LINK_UNRESOLVED')).toBe(true);
    expect(built.value.findings.some((f) => f.code === 'STORY_NO_PLACE')).toBe(true);
  });
});
