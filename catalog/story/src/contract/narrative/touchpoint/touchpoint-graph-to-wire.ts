import type { TouchpointGraphWire } from '../types/touchpoint-catalog.js';

export type TouchpointGraphWireLocus = 'physical' | 'digital' | 'blended';

export type TouchpointGraphWireInput = {
  hubTouchpointId?: string;
  touchpoints?: readonly {
    id: string;
    label?: string;
    journeyPhase?: string;
    locus?: string;
    venueKey?: string;
    spaceId?: string;
  }[];
  links?: readonly {
    fromTouchpointId: string;
    toTouchpointId: string;
    label?: string;
  }[];
};

function samLocusFromSpec(locus: string | undefined): TouchpointGraphWireLocus | undefined {
  if (locus === 'physical' || locus === 'digital' || locus === 'blended') {
    return locus;
  }
  return undefined;
}

/** Normalize host/org touchpoint graph JSON to SAM {@link TouchpointGraphWire}. */
export function touchpointGraphToSamWire(graph: TouchpointGraphWireInput): TouchpointGraphWire {
  const touchpoints = (graph.touchpoints ?? []).map((row) => ({
    id: row.id,
    label: row.label,
    journeyPhase: row.journeyPhase,
    locus: samLocusFromSpec(row.locus),
    venueKey: row.venueKey?.trim(),
    spaceId: row.spaceId,
  }));

  return {
    hubTouchpointId: graph.hubTouchpointId,
    touchpoints,
    links: graph.links?.map((link) => ({
      fromTouchpointId: link.fromTouchpointId,
      toTouchpointId: link.toTouchpointId,
      label: link.label,
    })),
  };
}
