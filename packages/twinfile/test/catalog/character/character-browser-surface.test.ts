import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { describe, expect, it } from 'vitest';

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');

const NODE_BUILTINS = new Set(['node:fs', 'node:path', 'node:url', 'fs', 'path', 'url']);

function packageExports(): Record<string, unknown> {
  return JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8')).exports;
}

async function collectStaticImports(entryRel: string): Promise<Set<string>> {
  const visited = new Set<string>();
  const queue = [join(packageRoot, entryRel)];

  while (queue.length > 0) {
    const file = queue.pop()!;
    if (visited.has(file)) continue;
    visited.add(file);
    if (!file.endsWith('.ts') && !file.endsWith('.js')) continue;

    let source: string;
    try {
      source = readFileSync(file, 'utf8');
    } catch {
      continue;
    }

    for (const match of source.matchAll(
      /(?:from|import)\s+['"]([^'"]+)['"]|export\s+\*\s+from\s+['"]([^'"]+)['"]/g,
    )) {
      const spec = match[1] ?? match[2];
      if (!spec) continue;
      if (NODE_BUILTINS.has(spec) || spec.startsWith('node:')) {
        throw new Error(`${file} imports Node builtin ${spec}`);
      }
      if (!spec.startsWith('.')) continue;
      const resolved = await import.meta.resolve(spec, pathToFileURL(file).href);
      queue.push(fileURLToPath(resolved));
    }
  }

  return visited;
}

describe('twinfile-character browser surface', () => {
  it('maps ./character to browser.ts under the browser export condition', () => {
    const character = packageExports()['./character'] as Record<string, string>;
    expect(character.browser).toBe('./dist/character/contract/character/browser.js');
    expect(character.default).toBe('./dist/character/contract/character/index.js');
  });

  it('exports persona id helpers used by locker/browser consumers', async () => {
    const browser = await import('../../../src/catalog/character/contract/character/browser.js');
    expect(typeof browser.allocateUniqueCharacterId).toBe('function');
    expect(typeof browser.buildCharacterIdSlug).toBe('function');
    expect(typeof browser.resolveCharacterDisplayName).toBe('function');
  });

  it('does not pull node:fs / node:path / node:url through the browser entry graph', async () => {
    await collectStaticImports('src/catalog/character/contract/character/browser.ts');
  });
});
