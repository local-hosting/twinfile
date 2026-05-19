import type { PCM } from '../types/pcm.js';
import type { SignalDimension } from '../types/story/signal-dimension.js';
import type { ResearchSignal } from '../types/story/research-signal.js';

function personaSlugFromPcmId(pcmId: string): string {
  return pcmId.replace(/^persona:/, '').trim();
}

/** Join AXM signal dimensions with PCM `signalValues` into portable research signals. */
export function researchSignalsFromDimensionsAndValues(
  pcmId: string,
  dimensions: readonly SignalDimension[],
  values: Readonly<Record<string, number>>,
): ResearchSignal[] {
  const slug = personaSlugFromPcmId(pcmId);
  const out: ResearchSignal[] = [];
  for (const dimension of dimensions) {
    const value = values[dimension.id];
    if (typeof value !== 'number' || Number.isNaN(value)) continue;
    out.push({
      id: `signal:${slug}-${dimension.id}`,
      personaId: pcmId,
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
export function hydratePcmSignalsFromDimensions(
  pcm: PCM,
  dimensions: readonly SignalDimension[] | undefined,
): PCM {
  const values = pcm.signalValues;
  if (!values || Object.keys(values).length === 0) {
    return pcm;
  }
  if (!dimensions?.length) {
    return pcm;
  }
  const signals = researchSignalsFromDimensionsAndValues(pcm.id, dimensions, values);
  return {
    ...pcm,
    signals,
  };
}
