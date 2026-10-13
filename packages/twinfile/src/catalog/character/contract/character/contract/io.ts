import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import yaml from 'js-yaml';

export function readYamlFile(path: string): unknown {
  const raw = readFileSync(path, 'utf8');
  return yaml.load(raw);
}

/** One object document, or a YAML array of objects (for consolidated forests). */
export function entitiesFromYamlDocument(value: unknown, sourcePath: string): unknown[] {
  if (value == null) return [];
  if (Array.isArray(value)) {
    const rows: unknown[] = [];
    for (const [index, row] of value.entries()) {
      if (row == null) continue;
      if (typeof row !== 'object' || Array.isArray(row)) {
        throw new Error(
          `loadEntityDir: ${sourcePath}[${index}] must be a mapping (got ${Array.isArray(row) ? 'array' : typeof row})`,
        );
      }
      rows.push(row);
    }
    return rows;
  }
  if (typeof value === 'object') {
    return [value];
  }
  throw new Error(
    `loadEntityDir: ${sourcePath} must be a mapping or array of mappings (got ${typeof value})`,
  );
}

export function loadEntityDir<T>(dir: string): T[] {
  if (!statSync(dir, { throwIfNoEntry: false })?.isDirectory()) {
    return [];
  }
  const items: T[] = [];
  const files = readdirSync(dir, { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isFile() && (entry.name.endsWith('.yml') || entry.name.endsWith('.yaml')),
    )
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
  for (const name of files) {
    const path = join(dir, name);
    for (const row of entitiesFromYamlDocument(readYamlFile(path), path)) {
      items.push(row as T);
    }
  }
  return items;
}

/**
 * Legacy nested strategy roots only — prefer topic folders on the Character root
 * (`needs/`, `mental-models/`, …). Kept so older catalogs still load.
 */
export const STRATEGY_DIR_CANDIDATES = ['strategy', 'a-strategy', 'f-strategy'] as const;
export const STORY_DIR_CANDIDATES = ['d-story', 'a-story', 'story'] as const;

export function resolveCharacterSubdir(root: string, candidates: readonly string[]): string {
  for (const name of candidates) {
    const path = join(root, name);
    if (statSync(path, { throwIfNoEntry: false })?.isDirectory()) {
      return path;
    }
  }
  return join(root, candidates[0]);
}

/** Topic folders live on the Character root; fall back to a nested strategy dir if present. */
export function resolveCharacterStrategyTopicRoot(
  root: string,
  topicFolders: readonly string[],
): string {
  for (const topic of topicFolders) {
    if (statSync(join(root, topic), { throwIfNoEntry: false })?.isDirectory()) {
      return root;
    }
  }
  for (const name of STRATEGY_DIR_CANDIDATES) {
    const nested = join(root, name);
    if (statSync(nested, { throwIfNoEntry: false })?.isDirectory()) {
      return nested;
    }
  }
  return root;
}

export function loadTopicFolder(
  baseDir: string,
  folderMap: Record<string, string>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [subdir, key] of Object.entries(folderMap)) {
    const topicDir = join(baseDir, subdir);
    if (!statSync(topicDir, { throwIfNoEntry: false })?.isDirectory()) {
      continue;
    }
    out[key] = loadEntityDir(topicDir);
  }
  return out;
}
