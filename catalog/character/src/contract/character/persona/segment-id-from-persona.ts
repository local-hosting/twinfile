/** Normalize Character `persona.segment` to a host segment id (last `:` path segment). */
export function segmentIdFromPersonaSegment(segment: string | undefined): string {
  const trimmed = segment?.trim() ?? '';
  if (!trimmed) return 'default';
  const colon = trimmed.lastIndexOf(':');
  return colon >= 0 ? trimmed.slice(colon + 1) : trimmed;
}

/** @deprecated Prefer {@link segmentIdFromPersonaSegment}. */
export const segmentIdFromCharacterPersonaSegment = segmentIdFromPersonaSegment;
