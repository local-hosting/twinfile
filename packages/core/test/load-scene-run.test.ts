import { mkdtempSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { describe, expect, it } from 'vitest';

import { loadRunUnit, sceneAddress } from '../src/load/load-scene-run.js';
import { twinHeadPath } from '../src/load/twinfile-locator.js';

function writeStory(root: string, body: string): string {
  writeFileSync(twinHeadPath(root), body);
  return root;
}

describe('loadRunUnit', () => {
  it('defaults run.from from the story involves place', () => {
    const root = writeStory(
      mkdtempSync(join(tmpdir(), 'twinfile-scene-')),
      `twinfile: 2
kind: story
id: demo-story
name: Demo
version: 0.1.0
stability: example
links:
  - rel: involves
    href: twinfile/place/shop:0.2.0
story:
  scenes:
    - id: surge
      label: Surge
      run:
        steps:
          - copy: twinfile/event/passenger-queue:1.0.0
`,
    );
    const loaded = loadRunUnit(sceneAddress(root, 'surge'));
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    expect(loaded.value.twinfile.from).toBe('twinfile/place/shop:0.2.0');
    expect(loaded.value.twinfile.id).toBe('surge');
    expect(loaded.value.scene?.id).toBe('surge');
  });

  it('keeps an explicit run.from over the involves place', () => {
    const root = writeStory(
      mkdtempSync(join(tmpdir(), 'twinfile-scene-')),
      `twinfile: 2
kind: story
id: demo-story
name: Demo
version: 0.1.0
stability: example
links:
  - rel: involves
    href: twinfile/place/shop:0.2.0
story:
  scenes:
    - id: surge
      run:
        from: twinfile/place/airport:0.2.0
        steps:
          - copy: twinfile/event/passenger-queue:1.0.0
`,
    );
    const loaded = loadRunUnit(sceneAddress(root, 'surge'));
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    expect(loaded.value.twinfile.from).toBe('twinfile/place/airport:0.2.0');
  });

  it('rejects a missing from when involves place is ambiguous', () => {
    const root = writeStory(
      mkdtempSync(join(tmpdir(), 'twinfile-scene-')),
      `twinfile: 2
kind: story
id: demo-story
name: Demo
version: 0.1.0
stability: example
links:
  - rel: involves
    href: twinfile/place/shop:0.2.0
  - rel: involves
    href: twinfile/place/airport:0.2.0
story:
  scenes:
    - id: surge
      run:
        steps:
          - copy: twinfile/event/passenger-queue:1.0.0
`,
    );
    const loaded = loadRunUnit(sceneAddress(root, 'surge'));
    expect(loaded.ok).toBe(false);
    if (loaded.ok) return;
    expect(loaded.errors[0]?.message).toMatch(/ambiguous involves place/);
  });

  it('rejects a string run folder path', () => {
    const root = writeStory(
      mkdtempSync(join(tmpdir(), 'twinfile-scene-')),
      `twinfile: 2
kind: story
id: demo-story
name: Demo
version: 0.1.0
stability: example
links:
  - rel: involves
    href: twinfile/place/shop:0.2.0
story:
  scenes:
    - id: surge
      run: ./scenes/surge
`,
    );
    const loaded = loadRunUnit(sceneAddress(root, 'surge'));
    expect(loaded.ok).toBe(false);
    if (loaded.ok) return;
    expect(loaded.errors[0]?.message).toMatch(/inline mapping/);
  });
});
