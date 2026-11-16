import { existsSync, readdirSync, readFileSync, renameSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { isRecord } from '../doc/is-record.js';
import { twinHeadPath, twinLockPath } from '../load/twinfile-locator.js';
import { TWIN_CATALOG_TYPES } from '../paths/catalog-layout.js';
import { RUN_PRESET_NAMES } from '../types/twin-kind.js';
import { readYamlDocument } from '../validate/validate-yaml.js';

const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'expected', 'runs']);

const TWIN_HEAD_KINDS = new Set<string>([...TWIN_CATALOG_TYPES, 'mixin']);

const LEGACY_TWIN_HEADS = [
  'Twinfile.yaml',
  'twinfile.yaml',
  'Place.yaml',
  'place.yaml',
  'Resource.yaml',
  'resource.yaml',
  'Character.yaml',
  'character.yaml',
  'Story.yaml',
  'story.yaml',
];

const LEGACY_RUN_HEADS = ['Run.yaml', 'Event.yaml', 'event.yaml', 'preset.yaml', 'Preset.yaml'];

const LEGACY_LOCK = 'Twinfile.lock';

type HeadMove = { readonly from: string; readonly to: string };

function isFile(path: string): boolean {
  return statSync(path, { throwIfNoEntry: false })?.isFile() ?? false;
}

function declaresTwinKind(path: string): boolean {
  const { value } = readYamlDocument(path);
  return isRecord(value) && typeof value.kind === 'string' && TWIN_HEAD_KINDS.has(value.kind);
}

function firstMove(
  dir: string,
  legacy: readonly string[],
  to: string,
  accept: (path: string) => boolean,
): HeadMove | undefined {
  if (existsSync(to)) return undefined;
  const entries = new Set(readdirSync(dir));
  const name = legacy.find((n) => entries.has(n) && isFile(join(dir, n)) && accept(join(dir, n)));
  return name ? { from: join(dir, name), to } : undefined;
}

function headMoves(dir: string): HeadMove[] {
  const twin = firstMove(dir, LEGACY_TWIN_HEADS, twinHeadPath(dir), declaresTwinKind);
  const run = firstMove(dir, LEGACY_RUN_HEADS, join(dir, RUN_PRESET_NAMES[0]), () => true);
  const lock = firstMove(dir, [LEGACY_LOCK], twinLockPath(dir), () => true);
  const plans = join(dir, 'plans');
  const bindings = join(dir, 'bindings');
  const hasHead = twin !== undefined || isFile(twinHeadPath(dir));
  const bindingMove =
    hasHead && statSync(plans, { throwIfNoEntry: false })?.isDirectory() && !existsSync(bindings)
      ? { from: plans, to: bindings }
      : undefined;
  return [twin, run, lock, bindingMove].filter((m): m is HeadMove => m !== undefined);
}

function collectMoves(dir: string, recursive: boolean, out: HeadMove[]): void {
  out.push(...headMoves(dir));
  if (!recursive) return;
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const path = join(dir, name);
    if (statSync(path, { throwIfNoEntry: false })?.isDirectory()) collectMoves(path, true, out);
  }
}

function listMoves(root: string, recursive: boolean): HeadMove[] {
  const abs = resolve(root);
  if (!statSync(abs, { throwIfNoEntry: false })?.isDirectory()) return [];
  const out: HeadMove[] = [];
  collectMoves(abs, recursive, out);
  return out.sort((a, b) => a.from.localeCompare(b.from));
}

export function collectHeadUpgradePaths(root: string, recursive: boolean): string[] {
  return listMoves(root, recursive).map((m) => m.from);
}

function rewriteBindingRefs(unitDir: string): void {
  const head = twinHeadPath(unitDir);
  if (!isFile(head)) return;
  const text = readFileSync(head, 'utf8');
  const next = text.replace(/^plans:/m, 'bindings:').replace(/(^|[\s'"])plans\//gm, '$1bindings/');
  if (next !== text) writeFileSync(head, next);
}

/** Rename legacy heads to `<unit>.twin.yaml` / `run.yaml`, locks to `<unit>.twin.lock`, and `plans/` to `bindings/`. */
export function upgradeTypedHeadFiles(root: string, options: { check?: boolean; recursive?: boolean } = {}): number {
  const moves = listMoves(root, options.recursive ?? true);
  if (options.check) {
    for (const { from, to } of moves) console.error(`twin fmt --upgrade=heads: would rename ${from} → ${to}`);
    return moves.length > 0 ? 1 : 0;
  }
  for (const { from, to } of moves) {
    renameSync(from, to);
    console.log(`upgrade head ${from} → ${to}`);
  }
  for (const { to } of moves) {
    if (to.endsWith('/bindings')) rewriteBindingRefs(join(to, '..'));
  }
  return 0;
}
