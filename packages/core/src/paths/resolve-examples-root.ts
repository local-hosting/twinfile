import { isExamplesCatalogRoot } from './examples-catalog.js';
import { resolvePlaceExamplesCatalogRoot, resolveTwinfileRoot } from './catalog-layout.js';

/** Place golden catalog for the monorepo containing `fromDir`, when it exists. */
export function resolveExamplesRoot(fromDir?: string): string | undefined {
  const catalog = resolvePlaceExamplesCatalogRoot(resolveTwinfileRoot(fromDir));
  return isExamplesCatalogRoot(catalog) ? catalog : undefined;
}
