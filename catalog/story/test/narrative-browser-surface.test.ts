import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { describe, expect, it } from 'vitest';

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

const NODE_BUILTINS = new Set(['node:fs', 'node:path', 'node:url', 'fs', 'path', 'url']);

function packageExports(): Record<string, unknown> {
  return JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8')).exports;
}

async function collectStaticImports(entryRel: string): Promise<void> {
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
}

describe('twinfile-story browser surface', () => {
  it('maps ./narrative to browser.ts under the browser export condition', () => {
    const narrative = packageExports()['./narrative'] as Record<string, string>;
    expect(narrative.browser).toBe('./src/contract/narrative/browser.ts');
    expect(narrative.default).toBe('./src/contract/narrative/index.ts');
  });

  it('keeps an explicit ./narrative/browser subpath', () => {
    expect(packageExports()['./narrative/browser']).toBe('./src/contract/narrative/browser.ts');
  });

  it('does not pull node:fs / node:path / node:url through the browser entry graph', async () => {
    await collectStaticImports('src/contract/narrative/browser.ts');
  });

  it('exports browser-safe brief and catalog helpers used by fieldwise-locker', async () => {
    const browser = await import('../src/contract/narrative/browser.js');
    expect(typeof browser.isTechnicalStoryIdentityLabel).toBe('function');
    expect(browser.isTechnicalStoryIdentityLabel('rider-urban-commuter-3')).toBe(true);
    expect(typeof browser.buildDirectorScriptScenes).toBe('function');
    expect(typeof browser.mergeJobContextModels).toBe('function');
    expect(typeof browser.touchpointGraphToStoryWire).toBe('function');
    expect(typeof browser.placeSlugFromPlaceRef).toBe('function');
  });
});
