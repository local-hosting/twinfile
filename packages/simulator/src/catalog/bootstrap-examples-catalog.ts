import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { createEventCatalog, registerEventCatalog } from './event-catalog.js';
import { definePlaceEvent } from './place-event-request.js';
import type { PlaceEvent } from '../types/place-event.js';

let examplesRegistered = false;

type RegistryRow = {
  id: string;
  name: string;
  version?: string;
  stability?: string;
  catalogKind?: 'situation' | 'event';
  phases?: string[];
  timetable?: Record<string, string>;
  expects?: PlaceEvent['expects'];
  args?: Record<string, unknown>;
  catalog?: Record<string, unknown>;
};

function eventFromRow(row: RegistryRow): PlaceEvent {
  return definePlaceEvent({
    id: row.id,
    name: row.name,
    version: row.version,
    stability: row.stability,
    catalogKind: row.catalogKind,
    phases: row.phases,
    timetable: row.timetable,
    expects: row.expects,
    args: row.args,
    catalog: row.catalog,
  });
}

function loadRegistry(registryPath: string): void {
  if (!existsSync(registryPath)) return;
  const raw = readFileSync(registryPath, 'utf8');
  const rows = JSON.parse(raw) as RegistryRow[];
  if (!Array.isArray(rows) || rows.length === 0) return;
  const catalog = createEventCatalog();
  for (const row of rows) {
    if (row?.id && row?.name) catalog.register(eventFromRow(row));
  }
  registerEventCatalog(catalog);
}

/** Example place events (timetables, local stage packs) from `events.registry.json`. */
export function ensureExamplesEventCatalog(examplesRoot: string): void {
  if (examplesRegistered) return;
  loadRegistry(join(examplesRoot, 'events.registry.json'));
  examplesRegistered = true;
}

export function resetExamplesEventCatalogBootstrap(): void {
  examplesRegistered = false;
}
