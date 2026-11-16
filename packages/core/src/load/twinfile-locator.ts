import { basename, join } from 'node:path';
import { statSync } from 'node:fs';

import { TWIN_HEAD_FILES } from '../types/twin-kind.js';

/** Legacy place head names (one release fallback after `Place.yaml`). */
export const TWINFILE_YAML_NAMES = ['Twinfile.yaml', 'twinfile.yaml'] as const;

/** Preferred place head then legacy `Twinfile.yaml`. */
export const PLACE_HEAD_NAMES = [TWIN_HEAD_FILES.place, ...TWINFILE_YAML_NAMES] as const;

function findFirstHead(root: string, names: readonly string[]): string | undefined {
  for (const name of names) {
    const path = join(root, name);
    if (statSync(path, { throwIfNoEntry: false })?.isFile()) return path;
  }
  return undefined;
}

function findTwinfileYaml(root: string): string | undefined {
  return findFirstHead(root, PLACE_HEAD_NAMES);
}

/** Resolve `Twinfile.yaml` in `root`, if present. */
export function findTwinfileYamlPath(root: string): string | undefined {
  return findTwinfileYaml(root);
}

/** At most one Twinfile path per directory (case variants of the same name). */
export function listTwinfileYamlPaths(root: string): string[] {
  const found: string[] = [];
  for (const name of PLACE_HEAD_NAMES) {
    const path = join(root, name);
    if (statSync(path, { throwIfNoEntry: false })?.isFile()) found.push(path);
  }
  if (found.length <= 1) return found;
  const lower = new Set(found.map((p) => basename(p).toLowerCase()));
  return lower.size === 1 ? [found[0]!] : found;
}

export function twinfileYamlBasename(twinfilePath: string): string {
  return basename(twinfilePath);
}
