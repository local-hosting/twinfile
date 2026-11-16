import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Monorepo folder for the **four twin types** only (place, resource, character, story).
 * The **simulator** package is not under this hub — it operates on these catalogs at runtime
 * (`TF_EXAMPLES_ROOT`, `resolveTypeExamplesRoot`, …) with its own situation registry.
 */
export const TWIN_CATALOG_HUB = 'catalog' as const;

export const TWIN_CATALOG_TYPES = ['place', 'resource', 'character', 'story'] as const;

const SIMULATOR_PACKAGE = join('packages', 'simulator');

export type TwinCatalogType = (typeof TWIN_CATALOG_TYPES)[number];

export function catalogHubDir(twinfileRoot: string): string {
  return join(resolve(twinfileRoot), TWIN_CATALOG_HUB);
}

export function catalogTypeDir(twinfileRoot: string, type: TwinCatalogType): string {
  return join(catalogHubDir(twinfileRoot), type);
}

export function catalogTypeExamplesDir(twinfileRoot: string, type: TwinCatalogType): string {
  return join(catalogTypeDir(twinfileRoot, type), 'examples');
}

/** PCM/JSM YAML libraries (`libs/audience|journey|psychology/`) — not twin heads. */
export function catalogCharacterLibsDir(twinfileRoot: string): string {
  return join(catalogTypeDir(twinfileRoot, 'character'), 'libs');
}

export function typeExamplesRootCandidates(base: string, type: TwinCatalogType): string[] {
  return [catalogTypeExamplesDir(base, type)];
}

export function isTwinfileMonorepoRoot(dir: string): boolean {
  const root = resolve(dir);
  if (existsSync(join(root, 'packages', 'core'))) return true;
  if (
    TWIN_CATALOG_TYPES.every((d) =>
      existsSync(join(root, TWIN_CATALOG_HUB, d, 'package.json')),
    )
  ) {
    return true;
  }
  if (
    TWIN_CATALOG_TYPES.every((d) =>
      existsSync(join(root, TWIN_CATALOG_HUB, d, 'examples')),
    )
  ) {
    return true;
  }
  return false;
}

/** Monorepo root (`TF_TWINFILE_ROOT` or cwd walk). */
export function resolveTwinfileRoot(cwd = process.cwd()): string {
  const fromEnv = process.env.TF_TWINFILE_ROOT?.trim();
  if (fromEnv && existsSync(fromEnv)) return resolve(fromEnv);

  const legacy = process.env.TF_EXAMPLES_ROOT?.trim();
  if (legacy && existsSync(legacy)) {
    let dir = resolve(legacy);
    for (let i = 0; i < 8; i += 1) {
      if (isTwinfileMonorepoRoot(dir)) return dir;
      const parent = resolve(dir, '..');
      if (parent === dir) break;
      dir = parent;
    }
  }

  let dir = resolve(cwd);
  for (let i = 0; i < 12; i += 1) {
    if (isTwinfileMonorepoRoot(dir)) return dir;
    const parent = resolve(dir, '..');
    if (parent === dir) break;
    dir = parent;
  }
  return resolve(cwd);
}

export function resolveTwinfileRootFromPlaceCatalog(catalogRoot: string): string {
  let dir = resolve(catalogRoot);
  for (let i = 0; i < 8; i += 1) {
    if (isTwinfileMonorepoRoot(dir)) return dir;
    const parent = resolve(dir, '..');
    if (parent === dir) break;
    dir = parent;
  }
  return resolveTwinfileRoot();
}

/** Resolve monorepo root from a core script `import.meta.url`. */
export function resolveTwinfileRootFromImportMeta(moduleUrl: string | URL): string {
  const scriptDir = dirname(fileURLToPath(moduleUrl));
  const coreRoot = resolve(scriptDir, '../..');
  const candidates = [
    resolve(coreRoot, '../..'),
    resolve(coreRoot, '../../..'),
    resolve(scriptDir, '../../..'),
    resolve(scriptDir, '../../../..'),
  ];
  for (const candidate of candidates) {
    if (isTwinfileMonorepoRoot(candidate)) return candidate;
  }
  return candidates[0] ?? resolveTwinfileRoot();
}

/** Golden twin units for a kind (`catalog/<type>/examples`). */
export function resolveTypeExamplesRoot(type: TwinCatalogType, root?: string): string {
  const base = root ?? resolveTwinfileRoot();
  for (const candidate of typeExamplesRootCandidates(base, type)) {
    if (existsSync(candidate)) return candidate;
  }
  return catalogTypeExamplesDir(base, type);
}

/** Place golden catalog (`TF_PLACE_CATALOG` or legacy `TF_EXAMPLES_ROOT`). */
export function resolvePlaceExamplesCatalogRoot(root?: string): string {
  const fromEnv =
    process.env.TF_PLACE_CATALOG?.trim() ??
    process.env.TF_EXAMPLES_ROOT?.trim() ??
    process.env.EXAMPLES_ROOT?.trim();
  if (fromEnv && existsSync(fromEnv)) return resolve(fromEnv);
  return resolveTypeExamplesRoot('place', root);
}

/** Built places + runs: `@doppler-group/twinfile-simulator` (not a twin catalog type). */
export function resolveSimulatorPackageRoot(seed?: string): string | undefined {
  const fromEnv = process.env.TF_SIMULATOR_ROOT?.trim() ?? process.env.SIMULATOR_ROOT?.trim();
  if (fromEnv && existsSync(fromEnv)) return resolve(fromEnv);

  const twinRoot = resolveTwinfileRoot(seed);
  const monorepo = join(twinRoot, SIMULATOR_PACKAGE);
  if (existsSync(join(monorepo, 'events.registry.json'))) return monorepo;

  const sibling = join(twinRoot, 'simulator');
  if (existsSync(join(sibling, 'events.registry.json'))) return sibling;

  return undefined;
}

/** Default roots for compose, refs, and player: place catalog + simulator package. */
export function resolveTwinCatalogOperateRoots(seed?: string): {
  twinfileRoot: string;
  placeExamples: string;
  simulator?: string;
} {
  const twinfileRoot = resolveTwinfileRoot(seed);
  return {
    twinfileRoot,
    placeExamples: resolvePlaceExamplesCatalogRoot(twinfileRoot),
    simulator: resolveSimulatorPackageRoot(twinfileRoot),
  };
}

/** Character PCM/JSM YAML under `catalog/character/`. */
export function resolveCharacterCatalogRoot(seed?: string): string {
  const fromEnv = process.env.TF_CHARACTER_CATALOGS_ROOT?.trim();
  if (fromEnv) {
    const resolved = resolve(fromEnv);
    const libs = join(resolved, 'libs');
    if (existsSync(join(libs, 'audience'))) return libs;
    if (existsSync(join(resolved, 'audience'))) return resolved;
    return libs;
  }

  const twinRoot = seed ? resolveTwinfileRoot(seed) : resolveTwinfileRoot();
  return catalogCharacterLibsDir(twinRoot);
}
