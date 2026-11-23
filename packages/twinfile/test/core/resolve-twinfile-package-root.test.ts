import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { resolveTwinfilePackageRoot } from '@local-hosting/twinfile';

describe('resolveTwinfilePackageRoot', () => {
  it('finds @local-hosting/twinfile from dist and src module layouts', () => {
    const root = resolveTwinfilePackageRoot();
    const pkg = join(root, 'package.json');
    expect(existsSync(pkg)).toBe(true);
    const doc = JSON.parse(readFileSync(pkg, 'utf8')) as { name?: string };
    expect(doc.name).toBe('@local-hosting/twinfile');
    expect(existsSync(join(root, 'spec'))).toBe(true);
  });
});