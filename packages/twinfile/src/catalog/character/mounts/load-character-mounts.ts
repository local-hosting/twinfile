import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { resolveTwinfileRoot } from '@local-hosting/twinfile';

/** Legacy AXM strategy sidecar list (host project `a-strategy/character-ids.yml`), not a twin head. */
export type CharacterMountIds = { ids: string[] };

function parsePcmIdsFile(path: string): string[] {
  const raw = readFileSync(path, 'utf8');
  const ids: string[] = [];
  for (const line of raw.split('\n')) {
    const m = line.match(/^\s*-\s*([a-z0-9:_-]+)\s*$/i);
    if (m?.[1]) ids.push(m[1]);
  }
  return ids;
}

/** Read Character mount ids from a host AXM tree or the monorepo dev fixture. */
export function loadCharacterMountIds(projectRoot?: string): CharacterMountIds {
  const twinRoot = resolveTwinfileRoot(projectRoot);
  const candidates = [
    projectRoot ? join(projectRoot, 'a-strategy/character-ids.yml') : undefined,
    join(twinRoot, 'character/test/fixtures/character/character-ids.yml'),
  ].filter((p): p is string => Boolean(p));

  for (const path of candidates) {
    if (existsSync(path)) {
      return { ids: parsePcmIdsFile(path) };
    }
  }
  return { ids: [] };
}