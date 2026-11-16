import type { PcmAudienceAspectRef } from '../types/audience/audience-aspect-ref.js';
import type { PcmAudiencePlane } from '../types/audience/pcm-audience-plane.js';
import type { PCM } from '../types/pcm.js';
import type { ResearchSignal } from '../types/story/research-signal.js';

function slugTypeId(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function signalWeight(signal: ResearchSignal): number {
  if (signal.unit === 'percent') return Math.max(0, signal.value) / 100;
  return Math.max(0, signal.value);
}

function typeIdFromDemographicSignal(signal: ResearchSignal, group: string): string {
  const marker = `-demographic-${group}-`;
  const id = signal.id.startsWith('signal:') ? signal.id.slice('signal:'.length) : signal.id;
  const at = id.indexOf(marker);
  if (at >= 0) {
    return id.slice(at + marker.length);
  }
  return slugTypeId(signal.label);
}

/** Build a demographic audience plane from exclusive percent/ratio band signals on this PCM. */
export function demographicPlaneFromPcmSignals(
  signals: readonly ResearchSignal[] | undefined,
): PcmAudiencePlane | undefined {
  const demographic = (signals ?? []).filter((row) => row.category === 'demographic' && row.group);
  if (demographic.length === 0) return undefined;

  const aspects: PcmAudienceAspectRef[] = demographic.map((signal) => {
    const group = signal.group!.trim();
    return {
      frameworkId: group,
      typeId: typeIdFromDemographicSignal(signal, group),
      label: signal.label,
      weight: signalWeight(signal),
      source: 'declared' as const,
    };
  });

  return { aspects, source: 'declared' };
}

/** Resolve bands for sampling: authored `persona.demographic`, else demographic research signals. */
export function resolvePcmDemographicPlane(pcm: PCM): PcmAudiencePlane | undefined {
  const authored = pcm.persona.demographic;
  if (authored?.aspects?.length) {
    return authored;
  }
  return demographicPlaneFromPcmSignals(pcm.signals);
}

function pickWeighted(
  options: readonly { typeId: string; label?: string; weight: number }[],
  random: () => number,
): { typeId: string; label?: string } | undefined {
  if (options.length === 0) return undefined;
  const total = options.reduce((sum, row) => sum + row.weight, 0);
  if (total <= 0) {
    const index = Math.floor(random() * options.length);
    const row = options[index]!;
    return { typeId: row.typeId, ...(row.label ? { label: row.label } : {}) };
  }
  let cursor = random() * total;
  for (const row of options) {
    cursor -= row.weight;
    if (cursor <= 0) {
      return { typeId: row.typeId, ...(row.label ? { label: row.label } : {}) };
    }
  }
  const last = options[options.length - 1]!;
  return { typeId: last.typeId, ...(last.label ? { label: last.label } : {}) };
}

/**
 * Sample one band per demographic framework (age, income, …) from weighted aspects.
 * Aspects that share a `frameworkId` are treated as an exclusive distribution.
 */
export function sampleDemographicBandsFromPlane(
  plane: PcmAudiencePlane | undefined,
  random: () => number = Math.random,
): Record<string, string> {
  if (!plane?.aspects?.length) return {};

  const byFramework = new Map<string, { typeId: string; label?: string; weight: number }[]>();
  for (const aspect of plane.aspects) {
    const frameworkId = aspect.frameworkId.trim();
    if (!frameworkId || !aspect.typeId?.trim()) continue;
    const list = byFramework.get(frameworkId) ?? [];
    list.push({
      typeId: aspect.typeId.trim(),
      ...(aspect.label?.trim() ? { label: aspect.label.trim() } : {}),
      weight: typeof aspect.weight === 'number' ? Math.max(0, aspect.weight) : 0,
    });
    byFramework.set(frameworkId, list);
  }

  const out: Record<string, string> = {};
  for (const [frameworkId, options] of byFramework) {
    const picked = pickWeighted(options, random);
    if (picked) {
      out[frameworkId] = picked.label ?? picked.typeId;
    }
  }
  return out;
}

/** Sample demographic bands for a project instance from this PCM only. */
export function samplePcmDemographicBands(
  pcm: PCM,
  random: () => number = Math.random,
): Record<string, string> {
  return sampleDemographicBandsFromPlane(resolvePcmDemographicPlane(pcm), random);
}
