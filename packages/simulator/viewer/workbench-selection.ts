import type { WorkbenchCatalogEntry } from './types/workbench-api.js';
import {
  isWorkbenchProgrammeEntry,
  isWorkbenchProgrammeLens,
  isWorkbenchRegionEntry,
  programmeEntryKindLabel,
  resolveFocusSpaceId,
  resolveHostPlaceCatalogId,
  resolvePreviewCatalogId,
} from './workbench-host-place-scope.js';

/** Host site + optional programme lens (run / event) + layout focus. */
export type WorkbenchHostContext = {
  unitId: string | null;
  hostPlaceCatalogId: string | null;
  programmeLensId: string | null;
  previewCatalogId: string | null;
  focusSpaceId: string | undefined;
  programmeSelectionId: string | null;
};

export type WorkbenchChrome = {
  name: string;
  kind?: string;
  id?: string;
  version?: string;
  contextLine?: string;
};

export function resolveWorkbenchHostContext(
  unitId: string | null | undefined,
  programmeLensId: string | null,
  entries: WorkbenchCatalogEntry[],
): WorkbenchHostContext {
  return {
    unitId: unitId ?? null,
    hostPlaceCatalogId: resolveHostPlaceCatalogId(unitId, entries),
    programmeLensId,
    previewCatalogId: resolvePreviewCatalogId(unitId, entries),
    focusSpaceId: resolveFocusSpaceId(unitId, entries),
    programmeSelectionId: programmeLensId,
  };
}

/** Programme pick keeps spatial `unitId` on the host; lens id drives session (clock) only. */
export function applyProgrammeLensPick(
  entryId: string,
  entries: WorkbenchCatalogEntry[],
  currentUnitId: string | null,
): { unitId: string; programmeLensId: string | null } | null {
  const entry = entries.find((e) => e.id === entryId);
  if (!entry) return null;
  if (isWorkbenchProgrammeLens(entry)) {
    const host =
      entry.hostPlaceCatalogIds?.[0] ??
      entry.hostPlaceCatalogId ??
      resolveHostPlaceCatalogId(entryId, entries);
    if (!host) return null;
    const current = currentUnitId ? entries.find((e) => e.id === currentUnitId) : undefined;
    const keepNested =
      current &&
      resolveHostPlaceCatalogId(currentUnitId, entries) === host &&
      !isWorkbenchProgrammeEntry(current);
    return { unitId: keepNested ? currentUnitId! : host, programmeLensId: entryId };
  }
  return { unitId: entryId, programmeLensId: null };
}

export function resolveWorkbenchChrome(
  ctx: WorkbenchHostContext,
  entries: WorkbenchCatalogEntry[],
  previewMeta: { name?: string; kind?: string; id?: string; version?: string },
): WorkbenchChrome {
  const selected = ctx.unitId ? entries.find((e) => e.id === ctx.unitId) : undefined;
  const host = ctx.hostPlaceCatalogId ? entries.find((e) => e.id === ctx.hostPlaceCatalogId) : undefined;
  const lens = ctx.programmeLensId ? entries.find((e) => e.id === ctx.programmeLensId) : undefined;
  const regionFocus = Boolean(selected && isWorkbenchRegionEntry(selected));
  const spatialOnHost = Boolean(
    ctx.unitId &&
      ctx.hostPlaceCatalogId &&
      resolveHostPlaceCatalogId(ctx.unitId, entries) === ctx.hostPlaceCatalogId &&
      selected &&
      !isWorkbenchProgrammeEntry(selected) &&
      !isWorkbenchRegionEntry(selected),
  );
  const anchorHost = Boolean(lens || regionFocus || spatialOnHost);

  const name = anchorHost ? (host?.label ?? previewMeta.name ?? 'Untitled') : (previewMeta.name ?? 'Untitled');
  const kind = anchorHost ? host?.kind : previewMeta.kind;
  const id = anchorHost ? host?.id : previewMeta.id;
  const version = lens ? undefined : previewMeta.version;

  let contextLine: string | undefined;
  if (lens) {
    contextLine = [lens.label, programmeEntryKindLabel(lens.kind).toLowerCase()].join(' · ');
  } else if (regionFocus && selected) {
    contextLine = selected.label;
  }

  return { name, kind, id, version, contextLine };
}

/** Catalog id for session clock / `timeline.at` — programme run when a lens is active. */
export function resolveSessionCatalogId(
  ctx: WorkbenchHostContext,
): string | null {
  return ctx.programmeLensId ?? ctx.previewCatalogId;
}
