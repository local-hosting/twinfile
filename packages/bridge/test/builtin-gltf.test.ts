import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { bridge, importPlace } from '../src/builtins/gltf/index.js';
import { specRoot } from './spec-root.js';

function readSpec(rel: string): string {
  return readFileSync(join(specRoot(), rel), 'utf8');
}

describe('built-in gltf', () => {
  it('imports the gltf-scene conformance fixture', () => {
    const input = JSON.parse(readSpec('conf/map/gltf-scene.json')) as unknown;
    const imported = importPlace(input);
    const spaces = imported.place.spaces as Array<{ geometry?: { ref: string } }>;
    expect(spaces[0]?.geometry?.ref).toBe('sources/arena.glb#seats');
    expect(bridge.roles).toContain('geometry');
  });
});
