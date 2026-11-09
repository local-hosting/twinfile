import { mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { composeHeadUnitDocument } from '../src/compose/compose-head-unit.js';
import { composeHeadUnitDocument as composeExport } from '../src/compose/compose-head-unit.js';

function writeUnit(dir: string, id: string, body: string): string {
  mkdirSync(dir, { recursive: true });
  const path = join(dir, `${id}.twin.yaml`);
  writeFileSync(path, body);
  return path;
}

describe('composeHeadUnitDocument', () => {
  it('merges from chain and steps for character heads', () => {
    const root = join(tmpdir(), `compose-head-${Date.now()}`);
    for (const type of ['place', 'resource', 'character', 'context', 'story', 'event'] as const) {
      mkdirSync(join(root, 'catalog', type, 'examples'), { recursive: true });
    }
    const catalog = join(root, 'catalog', 'character', 'examples');

    const basePath = writeUnit(
      join(catalog, 'store-shopper-base'),
      'store-shopper-base',
      `twinfile: 2
kind: character
id: store-shopper-base
name: Store shopper base
version: 0.1.0
disclosure:
  synthetic: true
  no_pii: true
  note: Base
character:
  role: visitor
  segment: spec-forward
`,
    );

    const childPath = writeUnit(
      join(catalog, 'carrier-overlay'),
      'carrier-overlay',
      `from: twinfile/character/store-shopper-base:0.1.0
twinfile: 2
kind: character
id: carrier-overlay
name: Carrier overlay
version: 0.1.0
disclosure:
  synthetic: true
  no_pii: true
  note: Overlay
steps:
  - character:
      segment: tech-titan
      goals:
        - Activate mobile line
`,
    );

    const composed = composeExport(
      {
        from: 'twinfile/character/store-shopper-base:0.1.0',
        twinfile: 2,
        kind: 'character',
        id: 'carrier-overlay',
        name: 'Carrier overlay',
        version: '0.1.0',
        disclosure: { synthetic: true, no_pii: true, note: 'Overlay' },
        steps: [{ character: { segment: 'tech-titan', goals: ['Activate mobile line'] } }],
      },
      childPath,
      { examplesRoot: root },
    );

    expect(composed.ok).toBe(true);
    if (!composed.ok) return;
    expect(composed.value.id).toBe('carrier-overlay');
    expect(composed.value.character).toEqual({
      role: 'visitor',
      segment: 'tech-titan',
      goals: ['Activate mobile line'],
    });
    void basePath;
  });
});