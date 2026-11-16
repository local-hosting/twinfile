import { join } from 'node:path';

import {
  goldenSceneRunRelPath,
  resolvePlaceExamplesCatalogRoot,
  resolveSimulatorRoot,
  resolveTwinfileRoot,
} from '@local-hosting/twinfile-core';

export function testExamplesRoot(importMetaDir: string): string {
  return resolvePlaceExamplesCatalogRoot(resolveTwinfileRoot(importMetaDir));
}

export function testSimulatorRoot(importMetaDir: string): string {
  const root = resolveSimulatorRoot(importMetaDir);
  if (!root) throw new Error(`testSimulatorRoot: no simulator package above ${importMetaDir}`);
  return root;
}

export function testTwinfileRoot(importMetaDir: string): string {
  return resolveTwinfileRoot(importMetaDir);
}

/** Golden scene run dir (`catalog/story/examples/.../scenes/<id>/`). */
export function goldenSceneRunDir(importMetaDir: string, runId: string): string {
  return join(testTwinfileRoot(importMetaDir), goldenSceneRunRelPath(runId));
}

export function testCatalogRoots(importMetaDir: string): { examplesRoot: string; simulatorRoot: string } {
  return {
    examplesRoot: testExamplesRoot(importMetaDir),
    simulatorRoot: testSimulatorRoot(importMetaDir),
  };
}
