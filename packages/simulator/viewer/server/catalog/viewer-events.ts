import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import '@local-hosting/twinfile-simulator';
import {
  createEventCatalog,
  definePlaceEvent,
  mergedEventCatalog,
  placeEventCatalogKind,
  placeEventToHead,
  registerEventCatalog,
} from '@local-hosting/twinfile-simulator';

import type { ViewerRoots } from './viewer-catalog.js';

export type ViewerEventRow = {
  id: string;
  name: string;
  version: string;
  kind: 'situation' | 'event';
  phases?: string[];
  timetable?: Record<string, string>;
};

function eventFromRegistryRow(row: Record<string, unknown>) {
  return definePlaceEvent({
    id: String(row.id),
    name: String(row.name),
    version: typeof row.version === 'string' ? row.version : '1.0.0',
    stability: typeof row.stability === 'string' ? row.stability : undefined,
    catalogKind: row.catalogKind === 'event' ? 'event' : 'situation',
    phases: Array.isArray(row.phases) ? row.phases.filter((p): p is string => typeof p === 'string') : undefined,
    timetable:
      row.timetable && typeof row.timetable === 'object' && !Array.isArray(row.timetable)
        ? (row.timetable as Record<string, string>)
        : undefined,
    expects: row.expects as never,
    args: row.args as Record<string, unknown> | undefined,
    catalog: row.catalog as Record<string, unknown> | undefined,
  });
}

function loadRegistryFile(path: string, catalog: ReturnType<typeof createEventCatalog>): void {
  if (!existsSync(path)) return;
  const rows = JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>[];
  if (!Array.isArray(rows)) return;
  for (const row of rows) {
    if (row?.id && row?.name) catalog.register(eventFromRegistryRow(row));
  }
}

export function listViewerPlaceEvents(roots: ViewerRoots): ViewerEventRow[] {
  const catalog = createEventCatalog();
  const examplesRoots = (roots.examplesRoots ?? [])
    .map((r) => resolve(r))
    .filter((r, i, a) => a.indexOf(r) === i);
  const simulatorRoots = (roots.simulatorRoots ?? [])
    .map((r) => resolve(r))
    .filter((r, i, a) => a.indexOf(r) === i);

  for (const root of examplesRoots) {
    loadRegistryFile(join(root, 'events.registry.json'), catalog);
  }
  for (const root of simulatorRoots) {
    loadRegistryFile(join(root, 'events.registry.json'), catalog);
  }

  registerEventCatalog(catalog);
  const merged = mergedEventCatalog();
  return merged.list().map((event) => {
    const head = placeEventToHead(event);
    return {
      id: event.id,
      name: event.name,
      version: String(head.version ?? '1.0.0'),
      kind: placeEventCatalogKind(event),
      ...(event.phases?.length ? { phases: [...event.phases] } : {}),
      ...(event.timetable ? { timetable: { ...event.timetable } } : {}),
    };
  });
}
