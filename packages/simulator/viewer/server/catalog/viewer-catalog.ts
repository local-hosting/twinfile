import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { basename, dirname, join, relative, resolve, sep } from 'node:path';

import {
  isExamplesCatalogRoot,
  parseManifestPatches,
  resolveTwinfileRoot,
  resolveTypeExamplesRoot,
  twinfileDisplayName,
} from '@local-hosting/twinfile-core';
import { findTwinfileYamlPath } from '@local-hosting/twinfile-core';
import { parse as parseYaml } from 'yaml';

import { attachHostPlaceCatalogIds, attachSituationHostPlaceScopes } from './viewer-host-place-scope.js';
import { listViewerRegionCatalog } from './viewer-region-catalog.js';

export type ViewerCatalogGroup =
  | 'sites'
  | 'scenarios'
  | 'events'
  | 'situations'
  | 'mixins'
  | 'bases';

/** Golden bases are compose parents — browse sites/runs in the viewer, not `bases/`. */
export const VIEWER_CATALOG_INCLUDE_BASES = false;

/** Workbench sidebar / tabs — browse buckets, not manifest kinds. */
export const VIEWER_CATALOG_NAV_GROUPS: Array<{ id: ViewerCatalogGroup; label: string }> = [
  { id: 'sites', label: 'Sites' },
  { id: 'scenarios', label: 'Scenarios' },
  { id: 'situations', label: 'Situations' },
  { id: 'events', label: 'Events' },
];

const NAV_GROUP_ORDER = new Map(VIEWER_CATALOG_NAV_GROUPS.map((row, index) => [row.id, index]));

/** Sub-places live in manifest `spaces:` — not separate catalog rows until sub-place navigation ships. */
export const VIEWER_INLINE_SUBPLACES_ONLY = true;

/** Catalog row id: site places use the examples folder slug (`airport`); other groups keep a prefix. */
export function viewerCatalogEntryId(
  group: ViewerCatalogGroup,
  relKey: string,
  refId?: string,
): string {
  if (relKey === '.') return refId?.trim() || 'entry';
  if (group === 'sites') return relKey;
  return `${group}/${relKey}`;
}

/** First path segment of a catalog id — host place slug for scoped rows. */
export function hostPlaceSlugFromCatalogId(catalogId: string): string {
  const trimmed = catalogId.trim();
  if (!trimmed) return '';
  return trimmed.split('/')[0] ?? trimmed;
}

export type ViewerCatalogEntry = {
  id: string;
  label: string;
  group: ViewerCatalogGroup;
  kind: string;
  path: string;
  /** Id of the unit that copies this one from its `parts/` (or legacy `buildings/`) or `floors/` stage. */
  parent?: string;
  /** Workbench-only: merged `spaces[]` row id when `kind` is `region`. */
  region?: string;
  /** Host place Twinfile catalog id (examples folder slug, e.g. `airport`). */
  hostPlaceCatalogId?: string;
  /** Situations: host places whose runs `copy:` this pack. */
  hostPlaceCatalogIds?: string[];
};

const NESTED_STAGE_DIRS = new Set(['parts', 'buildings', 'floors']);

function isNestedSubPlacePath(relKey: string): boolean {
  return relKey.includes('parts/') || relKey.includes('buildings/') || relKey.includes('floors/');
}

/** Programme and pinned instances live under one site folder — one Sites row for the host twin. */
function isNestedSiteBundlePath(relKey: string): boolean {
  const segments = relKey.split('/').filter(Boolean);
  if (segments.length < 2) return false;
  const leaf = segments[segments.length - 1] ?? '';
  if (leaf === 'programme' || leaf.endsWith('-programme')) return true;
  return segments.includes('instances');
}

function unitManifestPath(dir: string): string | undefined {
  const head = findTwinfileYamlPath(dir);
  if (head) return head;
  const run = join(dir, 'run.yaml');
  return existsSync(run) ? run : undefined;
}

function hasTwinfile(dir: string): boolean {
  return unitManifestPath(dir) !== undefined;
}

function isRunPresetDir(dir: string): boolean {
  const manifest = unitManifestPath(dir);
  if (!manifest) return false;
  const base = basename(manifest).toLowerCase();
  return base.startsWith('preset.') || base === 'run.yaml';
}

function readManifestBits(unitDir: string): {
  id?: string;
  name?: string;
  kind?: string;
} {
  try {
    const manifestFile = unitManifestPath(unitDir);
    if (!manifestFile) return {};
    const raw = readFileSync(manifestFile, 'utf8');
    const id = raw.match(/^\s*id:\s*([^\n#]+)/m)?.[1]?.trim();
    const name = raw.match(/^\s*name:\s*([^\n#]+)/m)?.[1]?.trim();
    const kind =
      raw.match(/^\s*kind:\s*([^\n#]+)/m)?.[1]?.trim() ??
      (basename(manifestFile).toLowerCase().startsWith('preset.') ? 'run' : 'place');
    return { id, name, kind };
  } catch {
    return {};
  }
}

/** Twinfile browse is place-only; runs and events use preset.yaml and the event catalog. */
function isViewerCatalogKind(kind: string | undefined): boolean {
  return (kind ?? 'place') === 'place';
}

function readManifest(unitDir: string): Record<string, unknown> | undefined {
  try {
    const manifestFile = unitManifestPath(unitDir);
    if (!manifestFile) return undefined;
    const doc = parseYaml(readFileSync(manifestFile, 'utf8'));
    return doc && typeof doc === 'object' && !Array.isArray(doc) ? (doc as Record<string, unknown>) : undefined;
  } catch {
    return undefined;
  }
}

function placeDirHostsNestedUnits(unitDir: string): boolean {
  for (const name of readdirSync(unitDir)) {
    if (name.startsWith('.')) continue;
    const child = join(unitDir, name);
    if (!statSync(child, { throwIfNoEntry: false })?.isDirectory()) continue;
    if (name !== 'scenarios' && name !== 'events' && name !== 'parts' && name !== 'buildings' && name !== 'floors')
      continue;
    for (const sub of readdirSync(child)) {
      if (sub.startsWith('.')) continue;
      if (hasTwinfile(join(child, sub))) return true;
    }
  }
  return false;
}

/** Pin-only `from:` forks (e.g. Leeds mobility hub) stay resolvable but skip workbench venue rows. */
function isThinUnpublishedPlaceFork(unitDir: string, twinfile: Record<string, unknown>): boolean {
  if (placeDirHostsNestedUnits(unitDir)) return false;
  const { instructions } = parseManifestPatches(twinfile);
  if (instructions.length !== 1) return false;
  const step = instructions[0];
  if (step.type !== 'patch') return false;
  const place = step.doc.place;
  if (!place || typeof place !== 'object' || Array.isArray(place)) return false;
  return (place as { published?: unknown }).published === false;
}

function isViewerCatalogPlace(unitDir: string, kind: string | undefined): boolean {
  if ((kind ?? 'place') !== 'place') return true;
  const head = readManifest(unitDir);
  if (!head) return true;
  return !isThinUnpublishedPlaceFork(unitDir, head);
}

/** Map manifest kind + filesystem location → workbench browse bucket (`ViewerCatalogEntry.group`). */
function navGroupForRecipe(kind: string | undefined, unitPath: string): ViewerCatalogGroup {
  const k = kind ?? 'place';
  switch (k) {
    case 'situation':
      return 'situations';
    case 'scenario':
      return 'scenarios';
    case 'event':
      return 'events';
    case 'mixin':
      return 'mixins';
    case 'place': {
      const slug = basename(unitPath);
      if (unitPath.includes(`${sep}bases${sep}`) || unitPath.includes('/bases/') || slug.startsWith('base-')) {
        return 'bases';
      }
      if (unitPath.includes(`${sep}mixins${sep}`) || unitPath.includes('/mixins/') || slug.startsWith('mixin-')) {
        return 'mixins';
      }
      return 'sites';
    }
    default:
      return 'sites';
  }
}

function labelForUnit(twinfile: Record<string, unknown>, relId: string): string {
  const display = twinfileDisplayName(twinfile);
  if (display !== 'Untitled') return display;
  if (!relId || relId === '.') return 'summary';
  return relId
    .split('/')
    .filter(Boolean)
    .join(' / ');
}

function collectStorySceneRuns(storyExamplesRoot: string): ViewerCatalogEntry[] {
  const out: ViewerCatalogEntry[] = [];
  if (!statSync(storyExamplesRoot, { throwIfNoEntry: false })?.isDirectory()) return out;

  function walkStories(storyDir: string): void {
    const scenesDir = join(storyDir, 'scenes');
    if (statSync(scenesDir, { throwIfNoEntry: false })?.isDirectory()) {
      for (const sceneId of readdirSync(scenesDir)) {
        const runDir = join(scenesDir, sceneId);
        if (!isRunPresetDir(runDir)) continue;
        const bits = readManifestBits(runDir);
        const relKey = relative(storyExamplesRoot, runDir).split('\\').join('/');
        out.push({
          id: `scenarios/story/${relKey}`,
          label: labelForUnit({ id: bits.id, name: bits.name, kind: 'scenario' }, relKey),
          group: 'scenarios',
          kind: 'scenario',
          path: resolve(runDir),
        });
      }
    }
    for (const name of readdirSync(storyDir)) {
      if (name.startsWith('.') || name === 'scenes') continue;
      const child = join(storyDir, name);
      if (statSync(child, { throwIfNoEntry: false })?.isDirectory()) walkStories(child);
    }
  }

  for (const storyId of readdirSync(storyExamplesRoot)) {
    if (storyId.startsWith('.')) continue;
    const storyDir = join(storyExamplesRoot, storyId);
    if (!statSync(storyDir, { throwIfNoEntry: false })?.isDirectory()) continue;
    walkStories(storyDir);
  }
  return out;
}

function collectRunPresets(root: string): ViewerCatalogEntry[] {
  const out: ViewerCatalogEntry[] = [];
  const presetRoots: string[] = [];
  for (const name of readdirSync(root)) {
    if (name.startsWith('.') || name === 'conf' || name === 'presets') continue;
    const child = join(root, name);
    if (statSync(child, { throwIfNoEntry: false })?.isDirectory() && hasTwinfile(child)) {
      presetRoots.push(child);
    }
  }
  if (presetRoots.length === 0) return out;

  function walk(dir: string): void {
    for (const name of readdirSync(dir)) {
      if (name.startsWith('.')) continue;
      const child = join(dir, name);
      if (!statSync(child, { throwIfNoEntry: false })?.isDirectory()) continue;
      if (name === 'scenarios') {
        for (const runName of readdirSync(child)) {
          const runDir = join(child, runName);
          if (!statSync(runDir, { throwIfNoEntry: false })?.isDirectory()) continue;
          if (!isRunPresetDir(runDir)) continue;
          const bits = readManifestBits(runDir);
          const relKey = relative(root, runDir).split('\\').join('/');
          out.push({
            id: `scenarios/${relKey}`,
            label: labelForUnit({ id: bits.id, name: bits.name, kind: 'scenario' }, relKey),
            group: 'scenarios',
            kind: 'scenario',
            path: resolve(runDir),
          });
        }
      } else {
        walk(child);
      }
    }
  }

  for (const presetRoot of presetRoots) {
    walk(presetRoot);
  }
  return out;
}

function collectUnder(root: string, maxDepth: number): ViewerCatalogEntry[] {
  const out: ViewerCatalogEntry[] = [];
  const rootAbs = resolve(root);
  if (!statSync(rootAbs, { throwIfNoEntry: false })?.isDirectory()) {
    return out;
  }

  function walk(dir: string, depth: number, stageOwner?: string): void {
    if (depth > maxDepth) return;
    let selfId: string | undefined;
    if (hasTwinfile(dir)) {
      const relKey = relative(rootAbs, dir).split('\\').join('/') || '.';
      const absPath = resolve(dir);
      const bits = readManifestBits(dir);
      const { id: refId, kind } = bits;
      if (!isViewerCatalogKind(kind)) return;
      if (isViewerCatalogPlace(dir, kind)) {
        const group = navGroupForRecipe(kind, absPath);
        const unitKind = kind ?? 'place';
        const skipNestedPlace =
          VIEWER_INLINE_SUBPLACES_ONLY &&
          group === 'sites' &&
          unitKind === 'place' &&
          isNestedSubPlacePath(relKey);
        const skipNestedSiteBundle =
          group === 'sites' && unitKind === 'place' && isNestedSiteBundlePath(relKey);
        if (!skipNestedPlace && !skipNestedSiteBundle && (VIEWER_CATALOG_INCLUDE_BASES || group !== 'bases')) {
          selfId = viewerCatalogEntryId(group, relKey === '.' ? '.' : relKey, refId);
          out.push({
            id: selfId,
            label: labelForUnit({ id: bits.id, name: bits.name, kind: bits.kind }, relKey),
            group,
            kind: unitKind,
            path: absPath,
            ...(stageOwner ? { parent: stageOwner } : {}),
          });
        }
      }
    }
    for (const name of readdirSync(dir)) {
      if (name.startsWith('.')) continue;
      if (name === 'node_modules' || name === 'dist' || name === 'runs') continue;
      const child = join(dir, name);
      if (statSync(child, { throwIfNoEntry: false })?.isDirectory()) {
        const owner = selfId ? (NESTED_STAGE_DIRS.has(name) ? selfId : undefined) : stageOwner;
        walk(child, depth + 1, owner);
      }
    }
  }

  walk(rootAbs, 0);
  return out;
}

function compareCatalogEntries(a: ViewerCatalogEntry, b: ViewerCatalogEntry): number {
  const groupDelta = (NAV_GROUP_ORDER.get(a.group) ?? 99) - (NAV_GROUP_ORDER.get(b.group) ?? 99);
  if (groupDelta !== 0) return groupDelta;
  return a.label.localeCompare(b.label);
}

function isRegionCatalogEntry(u: ViewerCatalogEntry): boolean {
  return u.kind === 'region';
}

/** Group/label order: twin children, then rollup regions, under each parent. */
function sortViewerCatalog(units: ViewerCatalogEntry[]): ViewerCatalogEntry[] {
  const ids = new Set(units.map((u) => u.id));
  const children = new Map<string, ViewerCatalogEntry[]>();
  for (const u of units) {
    if (u.parent && ids.has(u.parent)) children.set(u.parent, [...(children.get(u.parent) ?? []), u]);
  }
  const out: ViewerCatalogEntry[] = [];
  const visit = (u: ViewerCatalogEntry): void => {
    out.push(u);
    const childRows = children.get(u.id) ?? [];
    const twins = childRows.filter((c) => !isRegionCatalogEntry(c)).sort(compareCatalogEntries);
    const regions = childRows.filter((c) => isRegionCatalogEntry(c)).sort(compareCatalogEntries);
    for (const child of [...twins, ...regions]) visit(child);
  };
  for (const root of units.filter((u) => !u.parent || !ids.has(u.parent)).sort(compareCatalogEntries)) visit(root);
  return out;
}

export type ViewerRoots = {
  examplesRoots?: string[];
  simulatorRoots?: string[];
  /** Standalone unit folders (<unit>.twin.yaml) not under a scanned catalog. */
  extraRecipeDirs?: string[];
};

function isDir(path: string): boolean {
  return statSync(path, { throwIfNoEntry: false })?.isDirectory() ?? false;
}

function pushUniqueRoots(list: string[], root: string): void {
  const abs = resolve(root);
  if (!isDir(abs)) return;
  if (!list.some((r) => resolve(r) === abs)) {
    list.push(abs);
  }
}

function discoverExamplesCatalogRoot(fromDir: string): string | undefined {
  let dir = resolve(fromDir);
  for (let i = 0; i < 10; i += 1) {
    if (isExamplesCatalogRoot(dir)) {
      return dir;
    }
    const parent = resolve(dir, '..');
    if (parent === dir) break;
    dir = parent;
  }
  return undefined;
}

function discoverSimulatorCatalogRoot(fromDir: string): string | undefined {
  let dir = resolve(fromDir);
  for (let i = 0; i < 10; i += 1) {
    if (isDir(join(dir, 'situations'))) {
      return dir;
    }
    const parent = resolve(dir, '..');
    if (parent === dir) break;
    dir = parent;
  }
  return undefined;
}

/** Classify CLI paths: examples/simulator catalogs, `places/` / `situations/` slices, or single units. */
export function viewerRootsFromPaths(paths: string[]): ViewerRoots {
  const examplesRoots: string[] = [];
  const simulatorRoots: string[] = [];
  const extraRecipeDirs: string[] = [];

  for (const raw of paths) {
    const abs = resolve(raw);
    if (!isDir(abs)) continue;

    if (hasTwinfile(abs)) {
      pushUniqueRoots(extraRecipeDirs, abs);
      const ex = discoverExamplesCatalogRoot(abs);
      const hz = discoverSimulatorCatalogRoot(abs);
      if (ex) pushUniqueRoots(examplesRoots, ex);
      if (hz) pushUniqueRoots(simulatorRoots, hz);
      continue;
    }

    if (isExamplesCatalogRoot(abs)) {
      pushUniqueRoots(examplesRoots, abs);
      continue;
    }

    if (isDir(join(abs, 'situations'))) {
      pushUniqueRoots(simulatorRoots, abs);
      continue;
    }

    if (isDir(join(abs, 'mixins'))) {
      pushUniqueRoots(examplesRoots, abs);
      continue;
    }

    if (basename(abs) === 'situations' && isDir(abs)) {
      pushUniqueRoots(simulatorRoots, dirname(abs));
      continue;
    }

    const ex = discoverExamplesCatalogRoot(abs);
    const hz = discoverSimulatorCatalogRoot(abs);
    if (ex) pushUniqueRoots(examplesRoots, ex);
    if (hz) pushUniqueRoots(simulatorRoots, hz);
  }

  return {
    examplesRoots,
    simulatorRoots,
    extraRecipeDirs,
  };
}

export function catalogEntryFromDir(unitDir: string): ViewerCatalogEntry | undefined {
  const abs = resolve(unitDir);
  if (!hasTwinfile(abs)) return undefined;
  const bits = readManifestBits(abs);
  const { kind } = bits;
  const group = navGroupForRecipe(kind, abs);
  if (!VIEWER_CATALOG_INCLUDE_BASES && group === 'bases') return undefined;
  const slug = basename(abs);
  const id = viewerCatalogEntryId(group, slug, bits.id);
  return {
    id,
    label: labelForUnit({ id: bits.id, name: bits.name, kind: bits.kind }, slug),
    group,
    kind: kind ?? 'place',
    path: abs,
  };
}

/** Resolve CLI path (cwd-relative or walk-up) to an existing directory. */
export function resolveIncorporatePath(raw: string, fromDir = process.cwd()): string {
  const direct = resolve(fromDir, raw);
  if (isDir(direct)) return direct;
  const absolute = resolve(raw);
  if (isDir(absolute)) return absolute;
  let dir = resolve(fromDir);
  for (let i = 0; i < 8; i += 1) {
    const candidate = resolve(dir, raw);
    if (isDir(candidate)) return candidate;
    const parent = resolve(dir, '..');
    if (parent === dir) break;
    dir = parent;
  }
  return absolute;
}

function isValidUnitDir(dir: string): boolean {
  return isDir(dir) && hasTwinfile(dir);
}

/** Pick a unit directory that exists and contains <unit>.twin.yaml. */
export function resolveDefaultCatalogDir(preferred: string, roots: ViewerRoots): string {
  const abs = resolve(preferred);
  if (isValidUnitDir(abs)) return abs;
  const units = listViewerCatalog(roots);
  const hit = units.find((u) => resolve(u.path) === abs);
  if (hit && isDir(hit.path)) return hit.path;
  for (const u of units) {
    if (isValidUnitDir(u.path)) return u.path;
  }
  return abs;
}

/** First unit dir in paths, else first listable unit, else first valid path. */
export function defaultViewerCatalogDir(paths: string[], roots: ViewerRoots): string {
  for (const raw of paths) {
    const abs = resolveIncorporatePath(raw);
    if (isValidUnitDir(abs)) return abs;
  }
  const units = listViewerCatalog(roots);
  for (const u of units) {
    if (isValidUnitDir(u.path)) return u.path;
  }
  if (paths[0]) {
    return resolveIncorporatePath(paths[0]);
  }
  return resolve(process.cwd());
}

function mergeCatalogEntries(primary: ViewerCatalogEntry[], extra: ViewerCatalogEntry[]): ViewerCatalogEntry[] {
  const seenPath = new Set(primary.map((u) => resolve(u.path)));
  const seenId = new Set(primary.map((u) => u.id));
  for (const row of extra) {
    if (seenId.has(row.id)) continue;
    seenId.add(row.id);
    const abs = resolve(row.path);
    if (isRegionCatalogEntry(row)) {
      primary.push(row);
      continue;
    }
    if (seenPath.has(abs)) continue;
    seenPath.add(abs);
    primary.push(row);
  }
  return primary;
}

/** Place Twinfiles only — sidebar card browser must not list run presets or programme packs. */
export function isViewerPlaceCardCatalogEntry(entry: ViewerCatalogEntry): boolean {
  return entry.group === 'sites' && entry.kind === 'place';
}

export function listViewerPlaceCardCatalog(roots: ViewerRoots): ViewerCatalogEntry[] {
  return listViewerCatalog(roots).filter(isViewerPlaceCardCatalogEntry);
}

export function defaultViewerPlaceCardEntryId(
  roots: ViewerRoots,
  preferredUnitId?: string | null,
): string | null {
  const units = listViewerPlaceCardCatalog(roots);
  const preferred = preferredUnitId?.trim();
  if (preferred && units.some((u) => u.id === preferred)) return preferred;
  if (preferred) {
    const hit = findCatalogEntry(preferred, listViewerCatalog(roots));
    if (hit?.hostPlaceCatalogId && units.some((u) => u.id === hit.hostPlaceCatalogId)) {
      return hit.hostPlaceCatalogId;
    }
  }
  return units[0]?.id ?? null;
}

export function listViewerCatalog(roots: ViewerRoots): ViewerCatalogEntry[] {
  const examplesRoots = (roots.examplesRoots ?? [])
    .map((r) => resolve(r))
    .filter((r, i, a) => a.indexOf(r) === i);

  const simulatorRoots = (roots.simulatorRoots ?? [])
    .map((r) => resolve(r))
    .filter((r, i, a) => a.indexOf(r) === i);

  let units: ViewerCatalogEntry[] = [];
  for (const examples of examplesRoots) {
    units = mergeCatalogEntries(units, collectUnder(examples, 6));
    units = mergeCatalogEntries(units, collectRunPresets(examples));
    const storyExamples = resolveTypeExamplesRoot(
      'story',
      resolveTwinfileRoot(examples),
    );
    units = mergeCatalogEntries(units, collectStorySceneRuns(storyExamples));
  }
  for (const unitDir of roots.extraRecipeDirs ?? []) {
    const row = catalogEntryFromDir(unitDir);
    if (row && isViewerCatalogKind(row.kind)) units = mergeCatalogEntries(units, [row]);
  }
  if (!VIEWER_INLINE_SUBPLACES_ONLY) {
    units = mergeCatalogEntries(units, listViewerRegionCatalog(units));
  }
  attachHostPlaceCatalogIds(units);
  attachSituationHostPlaceScopes(units);
  const sorted = sortViewerCatalog(units);
  if (VIEWER_CATALOG_INCLUDE_BASES) return sorted;
  return sorted.filter((row) => row.group !== 'bases');
}

function regionHostPlaceCatalogId(unitId: string): string | undefined {
  const match = unitId.match(/^(.+)\/regions\/[^/]+$/);
  return match?.[1];
}

function findCatalogEntry(unitId: string | undefined, units: ViewerCatalogEntry[]): ViewerCatalogEntry | undefined {
  const trimmed = unitId?.trim();
  if (!trimmed) return undefined;
  const exact = units.find((u) => u.id === trimmed);
  if (exact) return exact;
  if (VIEWER_INLINE_SUBPLACES_ONLY) {
    const host = regionHostPlaceCatalogId(trimmed);
    if (host) {
      const place = units.find((u) => u.id === host);
      if (place) return place;
    }
  }
  const groupPrefixes = ['scenarios', 'events', 'situations', 'mixins', 'bases'] as const;
  for (const prefix of groupPrefixes) {
    if (trimmed.startsWith(`${prefix}/`)) continue;
    const candidate = units.find((u) => u.id === `${prefix}/${trimmed}`);
    if (candidate) return candidate;
  }

  const bySuffix = units.find((u) => u.id === trimmed || u.id.endsWith(`/${trimmed}`));
  if (bySuffix) return bySuffix;
  if (trimmed.includes('/')) {
    const byPathSuffix = units.find((u) => u.id.endsWith(trimmed));
    if (byPathSuffix) return byPathSuffix;
  }

  if (!trimmed.includes('/')) {
    return units.find((u) => u.id === trimmed || u.id.endsWith(`/${trimmed}`));
  }

  return undefined;
}

/** Examples/simulator catalog roots for building a unit (CLI paths + walk-up from unit dir). */
export function viewerBuildRootsForDir(
  activeUnitDir: string,
  roots: ViewerRoots,
): { examplesRoot?: string; simulatorRoot?: string } {
  const examplesRoot =
    roots.examplesRoots?.find((r) => activeUnitDir.startsWith(resolve(r))) ??
    roots.examplesRoots?.[0] ??
    discoverExamplesCatalogRoot(activeUnitDir);
  const simulatorRoot =
    roots.simulatorRoots?.find((r) => activeUnitDir.startsWith(resolve(r))) ??
    roots.simulatorRoots?.[0] ??
    discoverSimulatorCatalogRoot(activeUnitDir);
  return { examplesRoot, simulatorRoot };
}

/** Canonical catalog entry id (`?entry=` resolution). */
export function canonicalCatalogEntryId(unitId: string | undefined, roots: ViewerRoots): string | undefined {
  if (!unitId?.trim()) return undefined;
  const units = listViewerCatalog(roots);
  return findCatalogEntry(unitId, units)?.id;
}

export function resolveViewerTwinfileDir(
  unitId: string | undefined,
  roots: ViewerRoots,
  defaultUnitDir: string,
): string {
  const units = listViewerCatalog(roots);
  if (!unitId?.trim()) {
    return resolveDefaultCatalogDir(defaultUnitDir, roots);
  }
  const hit = findCatalogEntry(unitId, units);
  if (hit && isDir(hit.path)) {
    return hit.path;
  }
  return resolveDefaultCatalogDir(defaultUnitDir, roots);
}

export function catalogEntryIdForDir(unitDir: string, roots: ViewerRoots): string | undefined {
  const abs = resolve(unitDir);
  const units = listViewerCatalog(roots);
  return units.find((u) => resolve(u.path) === abs)?.id;
}

/** Prefer the requested catalog id (e.g. region row) over the first dir match (place). */
export function resolveViewerResponseUnitId(
  requestedUnit: string | undefined,
  activeDir: string,
  roots: ViewerRoots,
): string | null {
  return (
    canonicalCatalogEntryId(requestedUnit, roots) ??
    catalogEntryIdForDir(activeDir, roots) ??
    requestedUnit ??
    null
  );
}
