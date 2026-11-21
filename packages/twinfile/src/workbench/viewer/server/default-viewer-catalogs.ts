import { resolve } from 'node:path';

import { resolveExamplesRoot } from '@local-hosting/twinfile';

/** Default workbench catalog: place golden examples; events load from the event catalog. */
export function resolveDefaultViewerIncorporate(fromDir = process.cwd()): string[] {
  const examplesRoot = resolveExamplesRoot(fromDir);
  if (examplesRoot) return [resolve(examplesRoot)];
  return [];
}
