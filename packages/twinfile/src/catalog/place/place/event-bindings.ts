/**
 * Event role bindings — folded into `Place.data.eventBindings`.
 * Author with `steps: - bind:` or `bindings/*.yaml` on disk.
 */

export type EventBindingsMap = Record<string, Record<string, unknown>>;

/** Normalize path-keyed compose docs → event id (`for`) keyed map on `Place.data`. */
export function bindingDocsToEventBindings(
  docs: Record<string, unknown> | undefined,
): EventBindingsMap {
  const out: EventBindingsMap = {};
  if (!docs) return out;
  for (const doc of Object.values(docs)) {
    if (!doc || typeof doc !== 'object') continue;
    const forId = (doc as { for?: unknown }).for;
    if (typeof forId !== 'string' || !forId.length) continue;
    out[forId] = doc as Record<string, unknown>;
  }
  return out;
}

export function embedEventBindings(
  mergedPlace: Record<string, unknown>,
  bindingDocs: Record<string, unknown> | undefined,
): Record<string, unknown> {
  const bindings = bindingDocsToEventBindings(bindingDocs);
  if (Object.keys(bindings).length === 0) return mergedPlace;
  return { ...mergedPlace, eventBindings: bindings };
}

/** Read bindings from merged place data (`eventBindings` on `Place.data`). */
export function eventBindingsFromBuilt(mergedPlace: Record<string, unknown>): EventBindingsMap {
  const onPlace = mergedPlace.eventBindings;
  if (onPlace && typeof onPlace === 'object' && !Array.isArray(onPlace)) {
    return onPlace as EventBindingsMap;
  }
  return {};
}

/** Binding docs keyed by compose ref (`bind/<for>`), for strict check and summaries. */
export function bindingDocsFromEventBindings(
  bindings: EventBindingsMap,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(bindings).map(([forId, doc]) => [`bind/${forId}`, doc]),
  );
}

