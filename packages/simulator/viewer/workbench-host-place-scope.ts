import { twinfileManifestKindLabel } from '@local-hosting/twinfile-core';

import type { WorkbenchCatalogEntry } from './types/workbench-api.js';

/** Workbench browse: spatial tree vs programme transformers on the host site. */
export const HOST_PLACE_SUB_NAV = [
  { id: 'place-tree', label: 'Site' },
  { id: 'programme', label: 'Programme' },
] as const;

export type HostPlaceSubNavId = (typeof HOST_PLACE_SUB_NAV)[number]['id'];

export type HostPlaceProgrammeLayerId = 'scenarios' | 'events';

export function isWorkbenchProgrammeEntry(entry: WorkbenchCatalogEntry): boolean {
  if (entry.group === 'scenarios' || entry.group === 'events') return true;
  return entry.kind === 'scenario' || entry.kind === 'event';
}

/** Programme lenses on a host site — selection highlights the run/pack; preview stays on the place card. */
export function isWorkbenchProgrammeLens(entry: WorkbenchCatalogEntry): boolean {
  return entry.kind === 'scenario' || entry.kind === 'event';
}

/** Inline `spaces[]` row in the place tree — not its own Twinfile. */
export function isWorkbenchRegionEntry(entry: WorkbenchCatalogEntry | undefined): boolean {
  return entry?.kind === 'region';
}

/** Preview/build always uses the host place; regions steer layout focus; programme entries are lenses only. */
export function resolvePreviewCatalogId(
  entryId: string | null | undefined,
  entries: WorkbenchCatalogEntry[],
): string | null {
  if (!entryId) return null;
  const entry = entries.find((e) => e.id === entryId);
  if (!entry) return entryId;
  if (isWorkbenchRegionEntry(entry) || isWorkbenchProgrammeEntry(entry)) {
    return resolveHostPlaceCatalogId(entryId, entries) ?? entryId;
  }
  return entryId;
}

export function resolveFocusSpaceId(
  entryId: string | null | undefined,
  entries: WorkbenchCatalogEntry[],
): string | undefined {
  if (!entryId) return undefined;
  const entry = entries.find((e) => e.id === entryId);
  if (!entry || !isWorkbenchRegionEntry(entry)) return undefined;
  return entry.region;
}

export function programmeEntryKindLabel(kind: string | undefined): string {
  return twinfileManifestKindLabel(kind);
}

export function isRootHostPlaceEntry(entry: WorkbenchCatalogEntry): boolean {
  return entry.group === 'sites' && entry.kind === 'place' && !entry.parent && !entry.id.includes('/');
}

/** Catalog id of the host place Twinfile (`airport`) for the current selection. */
export function resolveHostPlaceCatalogId(
  entryId: string | null | undefined,
  entries: WorkbenchCatalogEntry[],
): string | null {
  if (!entryId) return null;
  const byId = new Map(entries.map((e) => [e.id, e]));
  let cur: WorkbenchCatalogEntry | undefined = byId.get(entryId);
  while (cur) {
    if (cur.hostPlaceCatalogId) return cur.hostPlaceCatalogId;
    const sharedHost = cur.hostPlaceCatalogIds?.[0];
    if (sharedHost) return sharedHost;
    if (isRootHostPlaceEntry(cur)) return cur.id;
    cur = cur.parent ? byId.get(cur.parent) : undefined;
  }
  return null;
}

function underPlaceTree(entry: WorkbenchCatalogEntry, hostPlaceCatalogId: string): boolean {
  if (entry.hostPlaceCatalogId !== hostPlaceCatalogId) return false;
  return entry.group === 'sites' || entry.kind === 'region';
}

function eventVisibleForHost(entry: WorkbenchCatalogEntry, hostPlaceCatalogId: string): boolean {
  if (entry.group !== 'events') return false;
  if (entry.hostPlaceCatalogId === hostPlaceCatalogId) return true;
  return entry.hostPlaceCatalogIds?.includes(hostPlaceCatalogId) ?? false;
}

export function filterCatalogForHostPlaceProgramme(
  entries: WorkbenchCatalogEntry[],
  hostPlaceCatalogId: string,
): WorkbenchCatalogEntry[] {
  const layers: HostPlaceProgrammeLayerId[] = ['scenarios', 'events'];
  const merged = layers.flatMap((layer) =>
    filterCatalogForHostPlaceSubNav(entries, hostPlaceCatalogId, layer),
  );
  const seen = new Set<string>();
  return merged.filter((e) => {
    if (seen.has(e.id)) return false;
    seen.add(e.id);
    return true;
  });
}

export function filterCatalogForHostPlaceSubNav(
  entries: WorkbenchCatalogEntry[],
  hostPlaceCatalogId: string,
  subNavId: HostPlaceSubNavId | HostPlaceProgrammeLayerId,
): WorkbenchCatalogEntry[] {
  switch (subNavId) {
    case 'place-tree':
      return entries.filter((e) => underPlaceTree(e, hostPlaceCatalogId));
    case 'programme':
      return filterCatalogForHostPlaceProgramme(entries, hostPlaceCatalogId);
    case 'scenarios':
      return entries.filter((e) => e.group === 'scenarios' && e.hostPlaceCatalogId === hostPlaceCatalogId);
    case 'events':
      return entries.filter((e) => eventVisibleForHost(e, hostPlaceCatalogId));
    default: {
      const never: never = subNavId;
      return never;
    }
  }
}

export function defaultSubNavForEntry(entry: WorkbenchCatalogEntry | undefined): HostPlaceSubNavId {
  if (!entry) return 'place-tree';
  if (isWorkbenchProgrammeEntry(entry)) return 'programme';
  return 'place-tree';
}

export function listRootHostPlaces(entries: WorkbenchCatalogEntry[]): WorkbenchCatalogEntry[] {
  return entries.filter(isRootHostPlaceEntry).sort((a, b) => a.label.localeCompare(b.label));
}

/** Example programme sites surfaced as workbench top-nav tabs (fixed order). */
export const WORKBENCH_HOST_PLACE_TAB_IDS = [
  'airport',
  'arena',
  'river',
  'park',
  'port',
  'shop',
  'expo',
  'mobility-hub',
] as const;

export function listWorkbenchHostPlaceTabs(entries: WorkbenchCatalogEntry[]): WorkbenchCatalogEntry[] {
  const byId = new Map(listRootHostPlaces(entries).map((e) => [e.id, e]));
  return WORKBENCH_HOST_PLACE_TAB_IDS.map((id) => byId.get(id)).filter(
    (e): e is WorkbenchCatalogEntry => e !== undefined,
  );
}

export function hostPlaceSubNavMeta(
  entries: WorkbenchCatalogEntry[],
  hostPlaceCatalogId: string,
  subNavId: HostPlaceSubNavId,
  label: string,
  visibleCount: number,
): string {
  const pool = filterCatalogForHostPlaceSubNav(entries, hostPlaceCatalogId, subNavId);
  const total = pool.length;
  if (total === 0 || visibleCount === 0) return `No ${label.toLowerCase()} for this place`;
  if (subNavId === 'programme') {
    return `${visibleCount} of ${total} ${label.toLowerCase()}`;
  }
  return `${visibleCount} ${label.toLowerCase()}`;
}
