import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { resolveTwinfileRoot } from '@doppler-group/twinfile-core';

/** Legacy AXM strategy sidecar list (host project `a-strategy/pcm-ids.yml`), not a twin head. */
export type AxmPcmMountIds = { ids: string[] };

function parsePcmIdsFile(path: string): string[] {
  const raw = readFileSync(path, 'utf8');
  const ids: string[] = [];
  for (const line of raw.split('\n')) {
    const m = line.match(/^\s*-\s*([a-z0-9:_-]+)\s*$/i);
    if (m?.[1]) ids.push(m[1]);
  }
  return ids;
}

/** Read PCM mount ids from a host AXM tree or the monorepo dev fixture. */
export function loadAxmPcmMountIds(projectRoot?: string): AxmPcmMountIds {
  const twinRoot = resolveTwinfileRoot(projectRoot);
  const candidates = [
    projectRoot ? join(projectRoot, 'a-strategy/pcm-ids.yml') : undefined,
    join(twinRoot, 'character/test/fixtures/axm/pcm-ids.yml'),
  ].filter((p): p is string => Boolean(p));

  for (const path of candidates) {
    if (existsSync(path)) {
      return { ids: parsePcmIdsFile(path) };
    }
  }
  return { ids: [] };
}