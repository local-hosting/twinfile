import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { entitiesFromYamlDocument, loadEntityDir } from '../../../src/contract/persona/contract/io.js';

describe('loadEntityDir', () => {
  it('flattens YAML arrays and single-document files', () => {
    const dir = mkdtempSync(join(tmpdir(), 'pcm-entity-dir-'));
    writeFileSync(join(dir, 'one.yml'), 'id: a\nlabel: A\n');
    writeFileSync(
      join(dir, 'many.yml'),
      ['- id: b', '  label: B', '- id: c', '  label: C', ''].join('\n'),
    );

    const rows = loadEntityDir<{ id: string; label: string }>(dir);
    expect(rows.map((row) => row.id).sort()).toEqual(['a', 'b', 'c']);
  });

  it('rejects non-object array entries', () => {
    expect(() => entitiesFromYamlDocument(['x'], 'x.yml')).toThrow(/must be a mapping/);
  });
});
