import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { exportPlace, importPlace } from '../src/builtins/bot/index.js';
import { specRoot } from './spec-root.js';

function readSpec(rel: string): string {
  return readFileSync(join(specRoot(), rel), 'utf8');
}

describe('built-in bot', () => {
  it('imports and exports the bot-storey conformance fixture', () => {
    const input = JSON.parse(readSpec('conf/map/bot-storey.json')) as unknown;
    const imported = importPlace(input);
    const spaces = imported.place.spaces as Array<{ level?: string; ext?: { usage?: string } }>;
    expect(imported.place.levels).toHaveLength(1);
    expect(spaces[0]).toMatchObject({ level: 's0', ext: { usage: 'office' } });
    expect(exportPlace(imported.place)).toBeDefined();
  });
});
