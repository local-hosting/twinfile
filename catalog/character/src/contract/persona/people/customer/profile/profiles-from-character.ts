import type { DemographicProfile } from '../../../demographic/demographic.schema.js';
import type { Character } from '../../../types/character.js';
import type { SignalDimension } from '../../../types/story/signal-dimension.js';
import { PersonaProfileSchema, type PersonaProfile } from '../../audience/persona.schema.js';
import { PsychographicSegmentProfileSchema, type PsychographicSegmentProfile } from './customer.js';
import { segmentAttitudesFromSignalValues } from './segment-attitudes-from-signals.js';

function requireSegmentId(character: Character): string {
  const segmentId = character.persona.segment;
  if (!segmentId) {
    throw new Error(`Character ${character.id} has no persona.segment — cannot publish segment profiles`);
  }
  return segmentId;
}

function wrap<K extends string, V>(key: K, value: V | undefined): Record<K, V> | undefined {
  return value === undefined ? undefined : ({ [key]: value } as Record<K, V>);
}

/** Psychographic segment profile from one Character twin plus shared AXM signal dimensions. */
export function psychographicSegmentProfileFromCharacter(
  character: Character,
  dimensions: readonly SignalDimension[],
): PsychographicSegmentProfile {
  const segmentId = requireSegmentId(character);
  const { feelings, phases } = character.persona.empathy ?? {};
  const { scenarios, ...strategy } = character.strategy ?? {};
  const attitudes = character.signalValues
    ? segmentAttitudesFromSignalValues(character.signalValues, dimensions)
    : undefined;

  return PsychographicSegmentProfileSchema.parse({
    id: segmentId,
    overview: character.overview,
    exemplarPersonaId: character.persona.exemplar?.id,
    visitFrequency: character.visitFrequency,
    attitudes: wrap('attitudes', attitudes),
    behavior: wrap('behavior', character.behavior),
    emotions: wrap('emotions', character.emotions),
    empathy: feelings || phases ? { empathy: { segment: segmentId, feelings, phases } } : undefined,
    mentalModel: character.mentalModelScope
      ? { mentalModel: { ...character.mentalModelScope, segment: segmentId } }
      : undefined,
    services: wrap('services', character.services),
    strategy: character.strategy
      ? { strategy: Object.keys(strategy).length > 0 ? strategy : undefined, scenarios }
      : undefined,
    objectives: character.objectives ?? [],
  });
}

/** Exemplar persona catalog row, or undefined when the twin has no exemplar id. */
export function personaProfileFromCharacter(character: Character): PersonaProfile | undefined {
  const { exemplar, empathy, quote } = character.persona;
  if (!exemplar?.id) return undefined;
  const segmentId = requireSegmentId(character);

  return PersonaProfileSchema.parse({
    ...exemplar,
    label: exemplar.name,
    quote: exemplar.quote ?? quote,
    empathy: empathy && { think: empathy.think, feel: empathy.feel, say: empathy.say, do: empathy.do },
    segmentAffinities: [{ segmentId, weight: 1 }],
  });
}

/** Demographic catalog row from the twin's demographic plane, or undefined without attributes. */
export function demographicProfileFromCharacter(character: Character): DemographicProfile | undefined {
  const plane = character.persona.demographic;
  if (!plane?.attributes) return undefined;
  const segmentId = requireSegmentId(character);

  return {
    id: plane.profileId ?? segmentId,
    label: plane.label ?? character.persona.label,
    segmentId,
    attributes: plane.attributes,
  };
}
