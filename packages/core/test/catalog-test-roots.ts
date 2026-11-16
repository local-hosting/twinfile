import { join } from 'node:path';

import { goldenSceneRunRelPath } from '../src/paths/golden-scene-runs.js';
import {
  resolvePlaceExamplesCatalogRoot,
  resolveTwinfileRoot,
} from '../src/paths/catalog-layout.js';

export function testExamplesRoot(importMetaDir: string): string {
  return resolvePlaceExamplesCatalogRoot(resolveTwinfileRoot(importMetaDir));
}

export function testTwinfileRoot(importMetaDir: string): string {
  return resolveTwinfileRoot(importMetaDir);
}

/** Golden scene run dir (`catalog/story/examples/.../scenes/<id>/`). */
export function goldenSceneRunDir(importMetaDir: string, runId: string): string {
  return join(testTwinfileRoot(importMetaDir), goldenSceneRunRelPath(runId));
}

export function testCatalogRoots(importMetaDir: string): { examplesRoot: string } {
  return {
    examplesRoot: testExamplesRoot(importMetaDir),
  };
}