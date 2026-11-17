import type { CharacterAudienceAspectRef } from '../types/audience/audience-aspect-ref.js';
import type { CharacterAudiencePlane } from '../types/audience/character-audience-plane.js';

function normalizeAspectWeights(aspects: readonly CharacterAudienceAspectRef[]): CharacterAudienceAspectRef[] {
  if (aspects.length === 0) return [];
  const withWeight = aspects.filter((row) => typeof row.weight === 'number');
  if (withWeight.length === 0) {
    return aspects.map((row) => ({ ...row }));
  }
  const total = withWeight.reduce((sum, row) => sum + (row.weight ?? 0), 0);
  if (total <= 0) {
    return aspects.map((row) => ({ ...row }));
  }
  return aspects.map((row) =>
    typeof row.weight === 'number' ? { ...row, weight: row.weight / total } : { ...row },
  );
}

/** Normalize aspect weights on one plane to sum to 1 when any weight is set. */
export function normalizeCharacterAudiencePlane(plane: CharacterAudiencePlane): CharacterAudiencePlane {
  return {
    ...plane,
    aspects: normalizeAspectWeights(plane.aspects),
  };
}
