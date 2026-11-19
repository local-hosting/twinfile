import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { importIfcProjection } from '../../src/bridge/builtins/ifc/import-ifc-projection.js';
import { bridge } from '../../src/bridge/builtins/ifc/index.js';
import { specRoot } from './spec-root.js';

describe('built-in ifc', () => {
  it('imports the spec projection fixture', () => {
    const input = JSON.parse(readFileSync(join(specRoot(), 'conf/map/ifc-building.json'), 'utf8')) as unknown;
    const imported = importIfcProjection(input);
    const site = imported.place.place as { ext?: { ifc_file?: string } };
    expect(site.ext?.ifc_file).toBe('sources/block.ifc');
    const spaces = imported.place.spaces as Array<{ kind: string; level?: string; ext?: { usage?: string } }>;
    expect(spaces[0]).toMatchObject({ kind: 'ifcspace', level: 's0', ext: { usage: 'office' } });
    expect(bridge.id).toBe('ifc');
  });
});
