import type { PlaceEvent, PlaceEventHead } from '../types/place-event.js';

type PlaceEventMeta = Omit<PlaceEvent, 'request'>;

export function placeEventCatalogKind(event: PlaceEventMeta): 'situation' | 'event' {
  if (event.catalogKind) return event.catalogKind;
  if (event.timetable && Object.keys(event.timetable).length > 0) return 'event';
  return 'situation';
}

/** Twinfile-shaped head for compose, contract check, and bundle metadata (not a spatial twin). */
export function placeEventToHead(event: PlaceEventMeta): PlaceEventHead {
  const kind = placeEventCatalogKind(event);
  const head: PlaceEventHead = {
    twinfile: 1,
    kind,
    id: event.id,
    name: event.name,
    version: event.version ?? '1.0.0',
    layers: event.layers ?? [],
    ...(event.stability ? { stability: event.stability } : {}),
    ...(event.phases?.length ? { phases: [...event.phases] } : {}),
    ...(event.timetable ? { timetable: { ...event.timetable } } : {}),
    ...(event.expects ? { expects: { ...event.expects } } : {}),
    ...(event.args ? { args: { ...event.args } } : {}),
    ...(event.catalog ? { catalog: { ...event.catalog } } : {}),
  };
  return head;
}

export function placeEventRef(event: PlaceEventMeta, tag?: string): string {
  const kind = placeEventCatalogKind(event);
  const version = tag ?? event.version ?? '1.0.0';
  return `twinfile/${kind}/${event.id}:${version}`;
}
