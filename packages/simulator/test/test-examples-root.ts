import { statSync } from 'node:fs';
import { join, resolve } from 'node:path';

import {
  goldenSceneRunRelPath,
  resolveTwinfileRoot,
  resolveTypeExamplesRoot,
} from '@doppler-group/twinfile-core';

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
    resolve(importMetaDir, '..'),
    resolve(examplesRoot, '../packages/simulator'),
    resolve(examplesRoot, '../../packages/simulator'),
  ];
  for (const candidate of candidates) {
    if (statSync(join(candidate, 'twin.local.yaml'), { throwIfNoEntry: false })?.isFile()) {
      return candidate;
    }
  }
  return candidates[0]!;
}

export function testTwinfileRoot(importMetaDir: string): string {
  return resolveTwinfileRoot(resolve(importMetaDir, '../../..'));
}

/** Golden scene run dir (`catalog/story/examples/.../scenes/<id>/`). */
export function goldenSceneRunDir(importMetaDir: string, runId: string): string {
  return join(testTwinfileRoot(importMetaDir), goldenSceneRunRelPath(runId));
}

export function testCatalogRoots(importMetaDir: string): { examplesRoot: string; simulatorRoot: string } {
  const examplesRoot = testExamplesRoot(importMetaDir);
  return { examplesRoot, simulatorRoot: testSimulatorRoot(importMetaDir) };
}