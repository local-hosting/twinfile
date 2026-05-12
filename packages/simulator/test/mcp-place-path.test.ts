import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { handleMcpRequest } from '@local-hosting/twinfile-simulator';

import { testExamplesRoot } from './test-examples-root.js';

describe('place.path MCP', () => {
  it('returns the `Place.digest` with the path', async () => {
    const examplesRoot = testExamplesRoot(dirname(fileURLToPath(import.meta.url)));
    const dir = join(examplesRoot, 'shop');
    const result = await handleMcpRequest(dir, {
      method: 'place.path',
      params: { from: 'sales-floor', to: 'stockroom' },
    });
    expect(typeof result.digest).toBe('string');
    expect(result.digest).toMatch(/^sha256:/);
    const path = result.path as { openings: string[]; length_m: number } | null;
    expect(path?.openings).toEqual(['door-stock']);
    expect(path?.length_m).toBe(0);
  });
});
