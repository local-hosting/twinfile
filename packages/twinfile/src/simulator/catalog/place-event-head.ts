import type { PlaceEvent, PlaceEventHead } from '../types/place-event.js';

type PlaceEventMeta = Omit<PlaceEvent, 'request'>;

/** Twinfile-shaped head for compose, contract check, and bundle metadata (not a spatial twin). */
export function placeEventToHead(event: PlaceEventMeta): PlaceEventHead {
  return {
    twinfile: 1,
    kind: 'event',
    id: event.id,
    name: event.name,
    version: event.version ?? '1.0.0',
    layers: event.layers ?? [],
    ...(event.stability ? { stability: event.stability } : {}),
    ...(event.phases?.length ? { phases: [...event.phases] } : {}),
    ...(event.expects ? { expects: { ...event.expects } } : {}),
    ...(event.args ? { args: { ...event.args } } : {}),
    ...(event.catalog ? { catalog: { ...event.catalog } } : {}),
  };
}

export function placeEventRef(event: PlaceEventMeta, tag?: string): string {
  return `twinfile/event/${event.id}:${tag ?? event.version ?? '1.0.0'}`;
}
