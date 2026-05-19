import { resolve } from 'node:path';

import { buildTwinfile, type BuildTwinfileResult } from '../build/build-twinfile.js';
import { resolveExamplesRoot } from '@local-hosting/twinfile-core';

export type McpServeOptions = {
  allowRuns?: boolean;
  /** Skip the layer cache. Tests use this so a new place does not write ~/.cache. */
  noCache?: boolean;
};

export async function openServedPlace(
  unitDir: string,
  options: McpServeOptions = {},
): Promise<{ ok: true; built: BuildTwinfileResult } | { ok: false; error: string }> {
  const dir = resolve(unitDir);
  const examplesRoot = resolveExamplesRoot(dir) ?? resolveExamplesRoot(process.cwd());
  if (!examplesRoot) return { ok: false, error: 'TF_EXAMPLES_ROOT required' };
  const built = await buildTwinfile(dir, {
    examplesRoot,
        writeLock: false,
        noCache: options.noCache,
  });
  if (!built.ok) return { ok: false, error: 'build failed' };
  return { ok: true, built: built.value };
}
