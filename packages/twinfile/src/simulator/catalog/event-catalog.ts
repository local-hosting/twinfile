import { readdirSync } from 'node:fs';
import { join } from 'node:path';

import { loadTwinfile, resolveTypeExamplesRoot } from '@local-hosting/twinfile';

import type { PlaceEvent } from '../types/place-event.js';
import { definePlaceEvent } from './place-event-request.js';

export class EventCatalog {
  private readonly byId = new Map<string, PlaceEvent>();

  register(event: PlaceEvent): this {
    this.byId.set(event.id, event);
    return this;
  }

  registerMany(events: Iterable<PlaceEvent>): this {
    for (const event of events) this.register(event);
    return this;
  }

  get(id: string): PlaceEvent | undefined {
    return this.byId.get(id);
  }

  has(id: string): boolean {
    return this.byId.has(id);
  }

  list(): PlaceEvent[] {
    return [...this.byId.values()].sort((a, b) => a.id.localeCompare(b.id));
  }

  merge(other: EventCatalog): this {
    for (const event of other.list()) this.register(event);
    return this;
  }
}

const registry: EventCatalog[] = [];
let unitsLoaded = false;

export function createEventCatalog(): EventCatalog {
  return new EventCatalog();
}

function eventFromHead(head: Record<string, unknown>): PlaceEvent {
  return definePlaceEvent({
    id: String(head.id),
    name: String(head.name ?? head.id),
    version: typeof head.version === 'string' ? head.version : undefined,
    stability: typeof head.stability === 'string' ? head.stability : undefined,
    phases: Array.isArray(head.phases) ? head.phases.map(String) : undefined,
    expects: head.expects as PlaceEvent['expects'],
    args: head.args as PlaceEvent['args'],
    catalog: head.catalog as PlaceEvent['catalog'],
  });
}

/** Event units under `catalog/event/examples/<id>/<id>.twin.yaml`; a bad head fails the whole catalog. */
export function loadEventCatalog(examplesDir = resolveTypeExamplesRoot('event')): EventCatalog {
  const catalog = createEventCatalog();
  const dirs = readdirSync(examplesDir, { withFileTypes: true }).filter((entry) => entry.isDirectory());
  for (const entry of dirs) {
    const loaded = loadTwinfile(join(examplesDir, entry.name));
    if (!loaded.ok) throw new Error(`event catalog: ${loaded.errors.map((e) => `${e.file ?? entry.name}: ${e.message}`).join('; ')}`);
    catalog.register(eventFromHead(loaded.value.twinfile));
  }
  return catalog;
}

/** Catalog event units load first; hosts (viewer, MCP, tests) register extra catalogs on top. */
function ensureEventUnits(): void {
  if (unitsLoaded) return;
  unitsLoaded = true;
  registry.unshift(loadEventCatalog());
}

export function registerEventCatalog(catalog: EventCatalog): void {
  ensureEventUnits();
  registry.push(catalog);
}

export function clearRegisteredEventCatalogs(): void {
  registry.length = 0;
  unitsLoaded = false;
}

export function mergedEventCatalog(): EventCatalog {
  ensureEventUnits();
  const out = createEventCatalog();
  for (const catalog of registry) out.merge(catalog);
  return out;
}

export function getRegisteredPlaceEvent(id: string): PlaceEvent | undefined {
  ensureEventUnits();
  for (let i = registry.length - 1; i >= 0; i -= 1) {
    const hit = registry[i]!.get(id);
    if (hit) return hit;
  }
  return undefined;
}

function versionMatches(manifestVersion: string, refTag: string | undefined): boolean {
  if (!refTag) return true;
  if (manifestVersion === refTag) return true;
  if (/^\d+$/.test(refTag) && manifestVersion.startsWith(`${refTag}.`)) return true;
  if (/^\d+\.\d+$/.test(refTag) && manifestVersion.startsWith(`${refTag}.`)) return true;
  return false;
}

/** Resolve `twinfile/event/id:tag` or `twinfile/event/id:tag` from registered catalogs. */
export function resolveRegisteredPlaceEventRef(ref: string): PlaceEvent | undefined {
  const trimmed = ref.trim();
  const body = trimmed.startsWith('twinfile/') ? trimmed.slice('twinfile/'.length) : trimmed;
  const slash = body.indexOf('/');
  if (slash <= 0) return undefined;
  const kind = body.slice(0, slash);
  if (kind !== 'event') return undefined;
  const rest = body.slice(slash + 1);
  const colon = rest.lastIndexOf(':');
  const id = colon > 0 ? rest.slice(0, colon) : rest;
  const tag = colon > 0 ? rest.slice(colon + 1) : undefined;
  const event = getRegisteredPlaceEvent(id);
  if (!event) return undefined;
  const version = event.version ?? '1.0.0';
  if (!versionMatches(version, tag)) return undefined;
  return event;
}
