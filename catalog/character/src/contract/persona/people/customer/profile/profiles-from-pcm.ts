import type { DemographicProfile } from '../../../demographic/demographic.schema.js';
import type { PCM } from '../../../types/pcm.js';
import type { SignalDimension } from '../../../types/story/signal-dimension.js';
import { PersonaProfileSchema, type PersonaProfile } from '../../audience/persona.schema.js';
import { PsychographicSegmentProfileSchema, type PsychographicSegmentProfile } from './customer.js';
import { segmentAttitudesFromSignalValues } from './segment-attitudes-from-signals.js';

function requireSegmentId(pcm: PCM): string {
  const segmentId = pcm.persona.segment;
  if (!segmentId) {
    throw new Error(`PCM ${pcm.id} has no persona.segment — cannot publish segment profiles`);
  }
  return segmentId;
}

function wrap<K extends string, V>(key: K, value: V | undefined): Record<K, V> | undefined {
  return value === undefined ? undefined : ({ [key]: value } as Record<K, V>);
}

/** Psychographic segment profile from one PCM twin plus shared AXM signal dimensions. */
export function psychographicSegmentProfileFromPcm(
  pcm: PCM,
  dimensions: readonly SignalDimension[],
): PsychographicSegmentProfile {
  const segmentId = requireSegmentId(pcm);
  const { feelings, phases } = pcm.persona.empathy ?? {};
  const { scenarios, ...strategy } = pcm.strategy ?? {};
  const attitudes = pcm.signalValues
    ? segmentAttitudesFromSignalValues(pcm.signalValues, dimensions)
    : undefined;

  return PsychographicSegmentProfileSchema.parse({
    id: segmentId,
    overview: pcm.overview,
    exemplarPersonaId: pcm.persona.exemplar?.id,
    visitFrequency: pcm.visitFrequency,
    attitudes: wrap('attitudes', attitudes),
    behavior: wrap('behavior', pcm.behavior),
    emotions: wrap('emotions', pcm.emotions),
    empathy: feelings || phases ? { empathy: { segment: segmentId, feelings, phases } } : undefined,
    mentalModel: pcm.mentalModelScope
      ? { mentalModel: { ...pcm.mentalModelScope, segment: segmentId } }
      : undefined,
    services: wrap('services', pcm.services),
    strategy: pcm.strategy
      ? { strategy: Object.keys(strategy).length > 0 ? strategy : undefined, scenarios }
      : undefined,
    objectives: pcm.objectives ?? [],
  });
}

/** Exemplar persona catalog row, or undefined when the twin has no exemplar id. */
export function personaProfileFromPcm(pcm: PCM): PersonaProfile | undefined {
  const { exemplar, empathy, quote } = pcm.persona;
  if (!exemplar?.id) return undefined;
  const segmentId = requireSegmentId(pcm);

  return PersonaProfileSchema.parse({
    ...exemplar,
    label: exemplar.name,
    quote: exemplar.quote ?? quote,
    empathy: empathy && { think: empathy.think, feel: empathy.feel, say: empathy.say, do: empathy.do },
    segmentAffinities: [{ segmentId, weight: 1 }],
  });
}

/** Demographic catalog row from the twin's demographic plane, or undefined without attributes. */
export function demographicProfileFromPcm(pcm: PCM): DemographicProfile | undefined {
  const plane = pcm.persona.demographic;
  if (!plane?.attributes) return undefined;
  const segmentId = requireSegmentId(pcm);

  return {
    id: plane.profileId ?? segmentId,
    label: plane.label ?? pcm.persona.label,
    segmentId,
    attributes: plane.attributes,
  };
}
