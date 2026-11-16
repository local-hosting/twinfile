import { existsSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { resolveSimulatorPackageRoot, resolveTwinfileRoot } from './catalog-layout.js';

function splitCatalogRootsEnv(varName: string): string[] {
  const raw = process.env[varName]?.trim();
  if (!raw) return [];
  return raw
    .split(/[,\n]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => resolve(s))
    .filter((p) => statSync(p, { throwIfNoEntry: false })?.isDirectory());
}

function discoverSimulatorRoot(seed: string): string | undefined {
  const resolvedSeed = resolve(seed);

  const fromTwinfile = resolveSimulatorPackageRoot(resolvedSeed);
  if (fromTwinfile) return fromTwinfile;

  const catalogCandidates = [
    resolve(resolvedSeed, '../packages/simulator'),
    resolve(resolvedSeed, '../../packages/simulator'),
    resolve(resolvedSeed, '../simulator'),
    resolve(resolvedSeed, '../../simulator'),
    resolve(resolvedSeed, '../../../simulator'),
  ];
  for (const catalogRoot of catalogCandidates) {
    if (existsSync(join(catalogRoot, 'events.registry.json'))) return catalogRoot;
    if (existsSync(join(catalogRoot, 'twin.local.yaml'))) return catalogRoot;
  }

  let dir = resolvedSeed;
  for (let i = 0; i < 8; i += 1) {
    const twinRoot = resolveTwinfileRoot(dir);
    const packaged = resolveSimulatorPackageRoot(twinRoot);
    if (packaged) return packaged;
    const parent = resolve(dir, '..');
    if (parent === dir) break;
    dir = parent;
  }

  return undefined;
}

/** Simulator package roots (situation registry — operates on twin catalogs, not a twin type). */
export function resolveSimulatorRoots(fromDir?: string): string[] {
  const fromEnv = [
    ...splitCatalogRootsEnv('TF_SIMULATOR_ROOT'),
    ...splitCatalogRootsEnv('SIMULATOR_ROOT'),
  ];
  const discovered = discoverSimulatorRoot(fromDir ?? process.cwd());
  const merged: string[] = [];
  for (const root of [...fromEnv, ...(discovered ? [discovered] : [])]) {
    const abs = resolve(root);
    if (!merged.some((r) => resolve(r) === abs)) {
      merged.push(abs);
    }
  }
  return merged;
}

export function resolveSimulatorRoot(fromDir?: string): string | undefined {
  return resolveSimulatorRoots(fromDir)[0];
}