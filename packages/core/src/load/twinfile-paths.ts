import { twinfileStepItems } from './twinfile-compose.js';

export type LayerMergeMode = 'patch' | 'replace';

export type ManifestLayerEntry = {
  path: string;
  mode: LayerMergeMode;
};

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((x): x is string => typeof x === 'string') : [];
}

/** Parse one manifest `layers:` item (string path or `{ path, mode? }`). */
export function parseManifestLayerEntry(item: unknown): ManifestLayerEntry | undefined {
  if (typeof item === 'string' && item.trim()) {
    return { path: item.trim(), mode: 'patch' };
  }
  if (item !== null && typeof item === 'object' && !Array.isArray(item)) {
    const row = item as Record<string, unknown>;
    const path = typeof row.path === 'string' ? row.path.trim() : '';
    if (!path) return undefined;
    const mode = row.mode === 'replace' ? 'replace' : 'patch';
    return { path, mode };
  }
  return undefined;
}

export function parseManifestLayerEntries(twinfile: Record<string, unknown>): ManifestLayerEntry[] {
  const raw = twinfile.layers;
  if (!Array.isArray(raw)) return [];
  const out: ManifestLayerEntry[] = [];
  for (const item of raw) {
    const entry = parseManifestLayerEntry(item);
    if (entry) out.push(entry);
  }
  return out;
}

export function isBindingLayerPath(rel: string): boolean {
  if (!rel.endsWith('.yaml') && !rel.endsWith('.yml')) return false;
  return rel.startsWith('bindings/') || rel.startsWith('plans/');
}

/** Place graph layer files (excludes situation binding files under `bindings/` or legacy `plans/`). */
export function twinfilePlaceLayerPaths(twinfile: Record<string, unknown>): ManifestLayerEntry[] {
  return parseManifestLayerEntries(twinfile).filter((e) => !isBindingLayerPath(e.path));
}

/** Place layer paths only (patch mode entries as strings). */
export function twinfileLayerPaths(twinfile: Record<string, unknown>): string[] {
  return twinfilePlaceLayerPaths(twinfile).map((e) => e.path);
}

/** Binding file paths: `bindings/*` or legacy `plans/*` in `layers:`, plus legacy manifest lists. */
export function twinfileBindingPaths(twinfile: Record<string, unknown>): string[] {
  const fromLayers = parseManifestLayerEntries(twinfile)
    .filter((e) => isBindingLayerPath(e.path))
    .map((e) => e.path);
  const legacy = [...stringList(twinfile.bindings), ...stringList(twinfile.plans)];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const rel of [...fromLayers, ...legacy]) {
    if (seen.has(rel)) continue;
    seen.add(rel);
    out.push(rel);
  }
  return out;
}

/** Full authoring stack (place + binding paths) for editor and `twin fmt`. */
export function twinfileStackPaths(twinfile: Record<string, unknown>): string[] {
  const layers = parseManifestLayerEntries(twinfile).map((e) => e.path);
  const legacyBindings = [...stringList(twinfile.bindings), ...stringList(twinfile.plans)].filter(
    (p) => !layers.includes(p),
  );
  return [...layers, ...legacyBindings];
}

/** Scenario stack refs: v1 `include:`, or `steps[].copy` of published units (RFC 0009). */
export function manifestScenarioComposeRefs(twinfile: Record<string, unknown>): string[] {
  const include = stringList(twinfile.include);
  if (include.length > 0) return include;
  if (twinfile.twinfile !== 2) return [];
  const steps = twinfileStepItems(twinfile);
  return steps.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const copy = (item as { copy?: unknown }).copy;
    if (typeof copy !== 'string') return [];
    const trimmed = copy.trim();
    if (trimmed.startsWith('./') || trimmed.startsWith('.\\')) return [];
    return [trimmed];
  });
}

/** Mixin refs in compose order: v1 `with:`, or leading non-local `copy:` steps. */
export function twinfileMixinRefs(twinfile: Record<string, unknown>): string[] {
  const fromWith = stringList(twinfile.with);
  if (twinfile.twinfile !== 2) return fromWith;
  const steps = twinfileStepItems(twinfile);
  const fromCopies = steps.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const copy = (item as { copy?: unknown }).copy;
    if (typeof copy !== 'string') return [];
    const trimmed = copy.trim();
    if (trimmed.startsWith('./') || trimmed.startsWith('.\\')) return [];
    return [trimmed];
  });
  return fromCopies.length ? fromCopies : fromWith;
}
