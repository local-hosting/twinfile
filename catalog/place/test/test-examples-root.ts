import {
  resolvePlaceExamplesCatalogRoot,
  resolveSimulatorRoot,
  resolveTwinfileRoot,
} from '@doppler-group/twinfile-core';

export function testExamplesRoot(importMetaDir: string): string {
  return resolvePlaceExamplesCatalogRoot(resolveTwinfileRoot(importMetaDir));
}

export function testSimulatorRoot(importMetaDir: string): string {
  const root = resolveSimulatorRoot(importMetaDir);
  if (!root) throw new Error(`testSimulatorRoot: no simulator package above ${importMetaDir}`);
  return root;
}

export function testCatalogRoots(importMetaDir: string): { examplesRoot: string; simulatorRoot: string } {
  return {
    examplesRoot: testExamplesRoot(importMetaDir),
    simulatorRoot: testSimulatorRoot(importMetaDir),
  };
}
