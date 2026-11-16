import { statSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { resolveTwinfileRoot, resolveTypeExamplesRoot } from '../src/paths/resolve-twinfile-root.js';

/** Examples root in monorepo (local) or CI (`TF_EXAMPLES_ROOT`). */
export function testExamplesRoot(importMetaDir: string): string {
  const fromEnv = process.env.TF_EXAMPLES_ROOT;
  if (fromEnv) {
    return resolve(fromEnv);
  }
  const twinRoot = resolveTwinfileRoot(resolve(importMetaDir, '../../..'));
  return resolveTypeExamplesRoot('place', twinRoot);
}

/** Simulator catalog root (`TF_SIMULATOR_ROOT` or sibling of examples). */
export function testSimulatorRoot(importMetaDir: string): string {
  const fromEnv = process.env.TF_SIMULATOR_ROOT;
  if (fromEnv) {
    return resolve(fromEnv);
  }
  const examplesRoot = testExamplesRoot(importMetaDir);
  const candidates = [
    resolve(importMetaDir, '../../simulator'),
    resolve(importMetaDir, '../../../packages/simulator'),
    resolve(examplesRoot, '../simulator'),
    resolve(examplesRoot, '../packages/simulator'),
    resolve(examplesRoot, '../../simulator'),
  ];
  for (const candidate of candidates) {
    if (
      statSync(join(candidate, 'events.registry.json'), { throwIfNoEntry: false })?.isFile() ||
      statSync(join(candidate, 'twin.local.yaml'), { throwIfNoEntry: false })?.isFile()
    ) {
      return candidate;
    }
  }
  return candidates[0]!;
}

export function testCatalogRoots(importMetaDir: string): { examplesRoot: string; simulatorRoot: string } {
  return {
    examplesRoot: testExamplesRoot(importMetaDir),
    simulatorRoot: testSimulatorRoot(importMetaDir),
  };
}