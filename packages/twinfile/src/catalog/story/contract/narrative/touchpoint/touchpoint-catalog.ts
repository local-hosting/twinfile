import type { TouchpointIndex, TouchpointIndexEntry } from '../types/touchpoint-index.js';
import type {
  StoryTouchpointCatalog,
  StoryTouchpointDefinition,
  TouchpointGraphWire,
} from '../types/touchpoint-catalog.js';

export function touchpointCatalogFromWire(wire: TouchpointGraphWire): StoryTouchpointCatalog {
  const touchpoints: StoryTouchpointDefinition[] = (wire.touchpoints ?? []).map((row) => ({
    id: row.id,
    label: row.label,
    journeyPhase: row.journeyPhase,
    locus: row.locus,
    placeRef: row.placeRef,
    spaceId: row.spaceId,
  }));

  return {
    hubTouchpointId: wire.hubTouchpointId,
    touchpoints,
    links: wire.links?.map((link) => ({
      fromTouchpointId: link.fromTouchpointId,
      toTouchpointId: link.toTouchpointId,
      label: link.label,
    })),
  };
}

export function touchpointIndexFromCatalog(catalog: StoryTouchpointCatalog): TouchpointIndex {
  const touchpoints: TouchpointIndexEntry[] = catalog.touchpoints.map((row) => ({
    id: row.id,
    label: row.label,
    journeyPhase: row.journeyPhase,
    locus: row.locus,
  }));
  return { touchpoints };
}

export function resolveTouchpointLabel(
  touchpointId: string,
  catalog?: StoryTouchpointCatalog,
  index?: TouchpointIndex,
): string {
  const fromCatalog = catalog?.touchpoints.find((row) => row.id === touchpointId);
  if (fromCatalog?.label?.trim()) {
    return fromCatalog.label.trim();
  }
  const fromIndex = index?.touchpoints.find((row) => row.id === touchpointId);
  if (fromIndex?.label?.trim()) {
    return fromIndex.label.trim();
  }
  return touchpointId;
}
