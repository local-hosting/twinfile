import { resolveGoldenSceneRun } from '../src/paths/golden-scene-runs.js';
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

/** Golden scene run address (`catalog/story/examples/<story>#<scene-id>`). */
export function goldenSceneRun(importMetaDir: string, runId: string): string {
  return resolveGoldenSceneRun(runId, testTwinfileRoot(importMetaDir));
}

export function testCatalogRoots(importMetaDir: string): { examplesRoot: string } {
  return {
    examplesRoot: testExamplesRoot(importMetaDir),
  };
}