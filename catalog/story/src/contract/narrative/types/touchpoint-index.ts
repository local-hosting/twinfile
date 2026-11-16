/** Minimal touchpoint row for journey binding validation and phase classification. */
export type TouchpointIndexEntry = {
  id: string;
  label?: string;
  /** Authoring hint — e.g. `pre-visit`, `on-site`. */
  journeyPhase?: string;
  locus?: 'physical' | 'digital' | 'blended';
};

export type TouchpointIndex = {
  touchpoints: readonly TouchpointIndexEntry[];
};

export function touchpointIndexFromIds(ids: readonly string[]): TouchpointIndex {
  return { touchpoints: ids.map((id) => ({ id })) };
}

export function touchpointIndexMap(index: TouchpointIndex): Map<string, TouchpointIndexEntry> {
  return new Map(index.touchpoints.map((row) => [row.id, row]));
}
