import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

import type { Plugin } from 'vite';

// Vitest resolves co-emitted src .js siblings before .ts; prefer TypeScript sources.
export function preferTypeScriptSourcePlugin(): Plugin {
  return {
    name: 'prefer-typescript-source',
    enforce: 'pre',
    resolveId(source, importer) {
      if (!source.endsWith('.js')) return null;
      const base = source.replace(/\.js$/, '');
      const candidates: string[] = [];
      if (source.startsWith('.')) {
        if (!importer) return null;
        candidates.push(join(dirname(importer), `${base}.ts`));
      } else if (source.includes('/src/')) {
        candidates.push(`${base}.ts`);
      }
      for (const file of candidates) {
        if (existsSync(file)) return file;
      }
      return null;
    },
  };
}