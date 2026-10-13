import { existsSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';

import type { Result } from '../types/twin-error.js';
import { ok } from '../types/twin-error.js';
import { findTwinfileYamlPath } from '../load/twinfile-locator.js';
import { normalizeManifestStack, orderPlaceTwinfileKeys } from './format-twinfile.js';
import { upgradeTwinfileToPatches, type UpgradedManifest } from './upgrade-twinfile.js';

const SKIP_DIRS = new Set(['node_modules', '.git', 'dist']);

export function twinfileYamlPaths(root: string, recursive: boolean): string[] {
  const abs = resolve(root);
  const stat = statSync(abs, { throwIfNoEntry: false });
  if (!stat) return [];

  if (stat.isFile()) {
    return isTwinfileManifest(abs) ? [abs] : [];
  }

  if (!stat.isDirectory()) return [];

  const out: string[] = [];

  if (!recursive) {
    const head = findTwinfileYamlPath(abs);
    return head ? [head] : [];
  }

  walkDir(abs, out);
  return [...new Set(out)].sort();
}

function walkDir(dir: string, out: string[]): void {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const name of entries) {
    if (SKIP_DIRS.has(name)) continue;
    const path = join(dir, name);
    const stat = statSync(path, { throwIfNoEntry: false });
    if (!stat) continue;
    if (stat.isDirectory()) {
      walkDir(path, out);
      continue;
    }
    if (!stat.isFile()) continue;
    if (!/\.ya?ml$/i.test(name)) continue;
    if (isTwinfileManifest(path)) out.push(path);
  }
}

function isTwinfileManifest(path: string): boolean {
  if (!existsSync(path)) return false;
  try {
    const raw = parseYaml(readFileSync(path, 'utf8')) as Record<string, unknown>;
    return (raw?.twinfile === 1 || raw?.twinfile === 2) && typeof raw.kind === 'string';
  } catch {
    return false;
  }
}

export type FormatTwinfileOptions = {
  check?: boolean;
  /** `2`: inline v1 layer/plan files into `steps:` and delete them (RFC 0009). */
  upgrade?: 2;
};

function formatTwinfile(
  twinfilePath: string,
  raw: Record<string, unknown>,
  upgrade: 2 | undefined,
): Result<UpgradedManifest> {
  if (raw.twinfile === 2) return ok({ twinfile: orderPlaceTwinfileKeys(raw), inlined: [] });
  if (upgrade !== 2) return ok({ twinfile: orderPlaceTwinfileKeys(normalizeManifestStack(raw)), inlined: [] });
  const upgraded = upgradeTwinfileToPatches(twinfilePath, raw);
  if (!upgraded.ok) return upgraded;
  return ok({ ...upgraded.value, twinfile: orderPlaceTwinfileKeys(upgraded.value.twinfile) });
}

/** Normalize one manifest file; returns exit code fragment (0 ok, 1 check failed, 2 upgrade error). */
export function formatTwinfilePath(twinfilePath: string, options: FormatTwinfileOptions = {}): number {
  const before = readFileSync(twinfilePath, 'utf8');
  const raw = parseYaml(before) as Record<string, unknown>;
  const result = formatTwinfile(twinfilePath, raw, options.upgrade);
  if (!result.ok) {
    for (const error of result.errors) console.error(`${error.file ?? twinfilePath}: ${error.message}`);
    return 2;
  }
  const normalized = stringifyYaml(result.value.twinfile);
  if (options.check) return normalized.trim() !== before.trim() ? 1 : 0;
  writeFileSync(twinfilePath, normalized);
  removeInlinedFiles(dirname(twinfilePath), result.value.inlined);
  return 0;
}

function removeInlinedFiles(root: string, rels: string[]): void {
  const dirs = new Set<string>();
  for (const rel of rels) {
    rmSync(join(root, rel), { force: true });
    dirs.add(dirname(join(root, rel)));
  }
  for (let dir of dirs) {
    while (dir !== root && existsSync(dir) && readdirSync(dir).length === 0) {
      rmSync(dir, { recursive: true });
      dir = dirname(dir);
    }
  }
}
