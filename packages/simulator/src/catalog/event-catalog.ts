import type { PlaceEvent } from '../types/place-event.js';

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

export function createEventCatalog(): EventCatalog {
  return new EventCatalog();
}

/** Hosts (viewer, MCP) register package catalogs; core resolver reads the merged view. */
export function registerEventCatalog(catalog: EventCatalog): void {
  registry.push(catalog);
}

export function clearRegisteredEventCatalogs(): void {
  registry.length = 0;
}

export function mergedEventCatalog(): EventCatalog {
  const out = createEventCatalog();
  for (const catalog of registry) out.merge(catalog);
  return out;
}

export function getRegisteredPlaceEvent(id: string): PlaceEvent | undefined {
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

/** Resolve `twinfile/situation/id:tag` or `twinfile/event/id:tag` from registered catalogs. */
export function resolveRegisteredPlaceEventRef(ref: string): PlaceEvent | undefined {
  const trimmed = ref.trim();
  const body = trimmed.startsWith('twinfile/') ? trimmed.slice('twinfile/'.length) : trimmed;
  const slash = body.indexOf('/');
  if (slash <= 0) return undefined;
  const kind = body.slice(0, slash);
  if (kind !== 'situation' && kind !== 'event') return undefined;
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
