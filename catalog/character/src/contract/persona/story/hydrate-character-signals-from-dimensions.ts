import type { Character } from '../types/character.js';
import type { SignalDimension } from '../types/story/signal-dimension.js';
import type { ResearchSignal } from '../types/story/research-signal.js';

function personaSlugFromPcmId(characterId: string): string {
  return characterId.replace(/^persona:/, '').trim();
}

/** Join AXM signal dimensions with Character `signalValues` into portable research signals. */
export function researchSignalsFromDimensionsAndValues(
  characterId: string,
  dimensions: readonly SignalDimension[],
  values: Readonly<Record<string, number>>,
): ResearchSignal[] {
  const slug = personaSlugFromPcmId(characterId);
  const out: ResearchSignal[] = [];
  for (const dimension of dimensions) {
    const value = values[dimension.id];
    if (typeof value !== 'number' || Number.isNaN(value)) continue;
    out.push({
      id: `signal:${slug}-${dimension.id}`,
      personaId: characterId,
      category: dimension.category,
      label: dimension.label,
      value,
      unit: dimension.unit,
      ...(dimension.group ? { group: dimension.group } : {}),
      ...(dimension.lowLabel ? { lowLabel: dimension.lowLabel } : {}),
      ...(dimension.highLabel ? { highLabel: dimension.highLabel } : {}),
      ...(dimension.source ? { source: dimension.source } : {}),
      ...(dimension.recordedAt ? { recordedAt: dimension.recordedAt } : {}),
      ...(dimension.lifecycle ? { lifecycle: dimension.lifecycle } : {}),
    });
  }
  return out;
}

/**
 * Attach hydrated `signals` from `signalValues` + shared dimensions.
 * Leaves existing `signals` when there are no values to join.
 */
export function hydrateCharacterSignalsFromDimensions(
  character: Character,
  dimensions: readonly SignalDimension[] | undefined,
): Character {
  const values = character.signalValues;
  if (!values || Object.keys(values).length === 0) {
    return character;
  }
  if (!dimensions?.length) {
    return character;
  }
  const signals = researchSignalsFromDimensionsAndValues(character.id, dimensions, values);
  return {
    ...character,
    signals,
  };
}
