import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { parse as parseYaml } from 'yaml';
import { describe, expect, it } from 'vitest';

import { buildProcessorsResourceFromTwinfile } from '../src/patch/build-processors-resource.js';
import { TWINFILE_PROCESSORS_RESOURCE_SCHEMA } from '../src/types/processors-resource.js';
import { TWINFILE_PATCH_UI_SCHEMA } from '../src/types/processor-ui.js';
import { testExamplesRoot } from './catalog-test-roots.js';

const arenaManifest = parseYaml(
  readFileSync(
    join(testExamplesRoot(dirname(fileURLToPath(import.meta.url))), 'arena/Twinfile.yaml'),
    'utf8',
  ),
) as Record<string, unknown>;

describe('buildProcessorsResourceFromTwinfile', () => {
  it('returns a JSON-safe resource body for any UI host', () => {
    const body = buildProcessorsResourceFromTwinfile(arenaManifest, { digest: 'sha256:test' });
    expect(body).toBeDefined();
    expect(body!.schema).toBe(TWINFILE_PROCESSORS_RESOURCE_SCHEMA);
    expect(body!.ui.schema).toBe(TWINFILE_PATCH_UI_SCHEMA);
    expect(body!.digest).toBe('sha256:test');
    expect(body!.graph.modules.length).toBe(body!.ui.modules.length);
    expect(JSON.parse(JSON.stringify(body))).toEqual(body);
  });

  it('returns undefined when manifest has no processors', () => {
    expect(buildProcessorsResourceFromTwinfile({ twinfile: 2, kind: 'place' })).toBeUndefined();
  });
});
