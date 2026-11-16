import { existsSync, readdirSync, renameSync, statSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';

const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'expected', 'runs']);

const PLACE_RENAMES: Record<string, string> = {
  'Twinfile.yaml': 'Place.yaml',
  'twinfile.yaml': 'Place.yaml',
};

const EVENT_RENAMES: Record<string, string> = {
  'preset.yaml': 'Event.yaml',
  'Preset.yaml': 'Event.yaml',
};

export function collectHeadUpgradePaths(root: string, recursive: boolean): string[] {
  const abs = resolve(root);
  const stat = statSync(abs, { throwIfNoEntry: false });
  if (!stat?.isDirectory()) return [];
  const out: string[] = [];
  collectHeads(abs, recursive, out);
  return out.sort();
}

function collectHeads(dir: string, recursive: boolean, out: string[]): void {
  for (const [from, to] of Object.entries({ ...PLACE_RENAMES, ...EVENT_RENAMES })) {
    const path = join(dir, from);
    const target = join(dir, to);
    if (existsSync(path) && !existsSync(target)) out.push(path);
  }
  if (!recursive) return;
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const path = join(dir, name);
    if (statSync(path, { throwIfNoEntry: false })?.isDirectory()) collectHeads(path, true, out);
  }
}

/** Rename legacy heads (`Twinfile.yaml` → `Place.yaml`, `preset.yaml` → `Event.yaml`). */
export function upgradeTypedHeadFiles(root: string, options: { check?: boolean; recursive?: boolean } = {}): number {
  const paths = collectHeadUpgradePaths(root, options.recursive ?? true);
  if (paths.length === 0) return 0;
  let failed = 0;
  for (const from of paths) {
    const dir = join(from, '..');
    const base = basename(from);
    const toName = PLACE_RENAMES[base] ?? EVENT_RENAMES[base];
    if (!toName) continue;
    const to = join(dir, toName);
    if (options.check) {
      console.error(`twin fmt --upgrade=heads: would rename ${from} → ${to}`);
      failed += 1;
      continue;
    }
    renameSync(from, to);
    console.log(`upgrade head ${from} → ${to}`);
  }
  return failed > 0 ? 1 : 0;
}