/**
 * Situation role bindings — folded into `Place.data.situationBindings`.
 * Author with `steps: - bind:` or `bindings/*.yaml` on disk.
 */

export type SituationBindingsMap = Record<string, Record<string, unknown>>;

/** Normalize path-keyed compose docs → situation id (`for`) keyed map on `Place.data`. */
export function bindingDocsToSituationBindings(
  docs: Record<string, unknown> | undefined,
): SituationBindingsMap {
  const out: SituationBindingsMap = {};
  if (!docs) return out;
  for (const doc of Object.values(docs)) {
    if (!doc || typeof doc !== 'object') continue;
    const forId = (doc as { for?: unknown }).for;
    if (typeof forId !== 'string' || !forId.length) continue;
    out[forId] = doc as Record<string, unknown>;
  }
  return out;
}

export function embedSituationBindings(
  mergedPlace: Record<string, unknown>,
  bindingDocs: Record<string, unknown> | undefined,
): Record<string, unknown> {
  const bindings = bindingDocsToSituationBindings(bindingDocs);
  if (Object.keys(bindings).length === 0) return mergedPlace;
  return { ...mergedPlace, situationBindings: bindings };
}

/** Read bindings from merged place data (`situationBindings` on `Place.data`). */
export function situationBindingsFromBuilt(mergedPlace: Record<string, unknown>): SituationBindingsMap {
  const onPlace = mergedPlace.situationBindings;
  if (onPlace && typeof onPlace === 'object' && !Array.isArray(onPlace)) {
    return onPlace as SituationBindingsMap;
  }
  return {};
}

/** Binding docs keyed by compose ref (`bind/<for>`), for strict check and summaries. */
export function bindingDocsFromSituationBindings(
  bindings: SituationBindingsMap,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(bindings).map(([forId, doc]) => [`bind/${forId}`, doc]),
  );
}

