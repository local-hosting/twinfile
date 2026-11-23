import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

import type { Plugin } from 'vite';

const pkgRoot = resolve(dirname(new URL(import.meta.url).pathname), '..');

const CATALOG_KINDS = ['place', 'character', 'context', 'story', 'event', 'resource'] as const;

type CatalogKind = (typeof CATALOG_KINDS)[number];

function catalogKindFromImporter(importer: string): CatalogKind | undefined {
  const normalized = importer.replace(/\\/g, '/');
  for (const kind of CATALOG_KINDS) {
    if (normalized.includes(`/test/catalog/${kind}/`)) return kind;
  }
  return undefined;
}

function resolveLegacyCatalogSrc(kind: CatalogKind, rel: string): string | undefined {
  const withoutExt = rel.replace(/\.js$/, '');
  const candidates: string[] = [];

  if (withoutExt === 'index') {
    candidates.push(join(pkgRoot, 'src/catalog', kind, 'index.ts'));
  } else {
    candidates.push(join(pkgRoot, 'src/catalog', kind, `${withoutExt}.ts`));
    candidates.push(join(pkgRoot, 'src/catalog', kind, `${withoutExt}.tsx`));
  }

  for (const file of candidates) {
    if (existsSync(file)) return file;
  }
  return undefined;
}

/** Rewrite `../../../src/...` imports in catalog tests to `src/catalog/<kind>/...`. */
export function legacyCatalogTestResolvePlugin(): Plugin {
  return {
    name: 'legacy-catalog-test-resolve',
    enforce: 'pre',
    resolveId(source, importer) {
      if (!importer?.includes('/test/catalog/')) return null;
      const match = /^((?:\.\.\/)+)src\/(.+)$/.exec(source);
      if (!match) return null;

      const kind = catalogKindFromImporter(importer.replace(/\\/g, '/'));
      if (!kind) return null;

      const rel = match[2];
      const resolved = resolveLegacyCatalogSrc(kind, rel);
      return resolved ?? null;
    },
  };
}