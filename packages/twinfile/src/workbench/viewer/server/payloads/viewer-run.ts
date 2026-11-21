import {
  type BuildTwinfileResult,
} from '@local-hosting/twinfile/place';
import {
  isRunUnit,
  twinfileDisplayName,
  twinfileRefId,
} from '@local-hosting/twinfile';

import type { RunOverview } from '../../types/workbench-api.js';

export function buildRunOverview(result: BuildTwinfileResult): RunOverview | undefined {
  const twinfile = result.loaded.twinfile;
  if (!isRunUnit(result.loaded)) return undefined;
  const use = twinfile.use as { runner?: string } | undefined;
  const meta = result.meta as { resolvedArgs?: Record<string, unknown> } | undefined;
  const field = (key: string): string | undefined => {
    const value = twinfile[key];
    return typeof value === 'string' ? value : undefined;
  };
  return {
    name: twinfileDisplayName(twinfile, result.data),
    id: twinfileRefId(twinfile) ?? field('id') ?? 'unknown',
    version: field('version') ?? '0.0.0',
    ...(field('question') ? { question: field('question') } : {}),
    ...(typeof use?.runner === 'string' ? { runner: use.runner } : {}),
    ...(twinfile.clock !== undefined ? { clock: twinfile.clock } : {}),
    ...(meta?.resolvedArgs ? { resolvedArgs: meta.resolvedArgs } : {}),
  };
}
