import { resolve } from 'node:path';

import { resolveTwinfileRoot, resolveTypeExamplesRoot } from '@local-hosting/twinfile-core';

/** Examples root in monorepo (local) or CI (`TF_EXAMPLES_ROOT`). */
export function testExamplesRoot(importMetaDir: string): string {
  const fromEnv = process.env.TF_EXAMPLES_ROOT;
  if (fromEnv) return resolve(fromEnv);
  const twinRoot = resolveTwinfileRoot(resolve(importMetaDir, '../../..'));
  return resolveTypeExamplesRoot('place', twinRoot);
}

/** Simulator catalog root (`TF_SIMULATOR_ROOT` or the workspace package). */
export function testSimulatorRoot(importMetaDir: string): string {
  const fromEnv = process.env.TF_SIMULATOR_ROOT;
  return fromEnv ? resolve(fromEnv) : resolve(importMetaDir, '../../../packages/simulator');
}

export function testCatalogRoots(importMetaDir: string): { examplesRoot: string; simulatorRoot: string } {
  return {
    examplesRoot: testExamplesRoot(importMetaDir),
    simulatorRoot: testSimulatorRoot(importMetaDir),
  };
}