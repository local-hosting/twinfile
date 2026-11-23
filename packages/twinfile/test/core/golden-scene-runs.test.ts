import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { resolveGoldenSceneRun } from '@local-hosting/twinfile';

const pkgRoot = join(dirname(fileURLToPath(import.meta.url)), '../..');

describe('resolveGoldenSceneRun', () => {
  it('resolves storm-at-halftime under src/catalog/story/examples', () => {
    const address = resolveGoldenSceneRun('storm-at-halftime', pkgRoot);
    const [storyDir] = address.split('#');
    expect(storyDir).toContain(join('src', 'catalog', 'story', 'examples', 'arena-resilience'));
    expect(existsSync(storyDir)).toBe(true);
    expect(address.endsWith('#storm-at-halftime')).toBe(true);
  });
});