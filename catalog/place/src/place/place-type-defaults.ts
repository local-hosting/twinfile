import { ProcessorGraph } from '@doppler-group/twinfile-core';
import { applyProcessorGraphToTwinfile } from '@doppler-group/twinfile-core';
import type { PatchGraphV1 } from '@doppler-group/twinfile-core';
import type { PlaceTypeV1 } from '@doppler-group/twinfile-core';
import type { Result, TwinError } from '@doppler-group/twinfile-core';
import { getDefaultValidator, validatePlaceTypeValue } from '@doppler-group/twinfile-core';

import { DEFAULT_SIGNAL_HUB_ID, DEFAULT_SIGNAL_HUB_TYPE } from './place-signal-hub-defaults.js';

export { DEFAULT_SIGNAL_HUB_ID, DEFAULT_SIGNAL_HUB_TYPE } from './place-signal-hub-defaults.js';

/** Minimum open host I/O every place Twinfile is assumed to expose when `processors:` is omitted. */
export const DEFAULT_PLACE_PROCESSOR_GRAPH: PatchGraphV1 = {
  modules: [{ id: DEFAULT_SIGNAL_HUB_ID, type: DEFAULT_SIGNAL_HUB_TYPE }],
  connections: [],
};

export function effectiveProcessorGraph(twinfile: Record<string, unknown>): PatchGraphV1 {
  const doc = ProcessorGraph.parseTwinfile(twinfile);
  if (doc) return doc.graph;
  return DEFAULT_PLACE_PROCESSOR_GRAPH;
}

/** Twinfile copy with default `processors:` when none are declared (host I/O only). */
export function twinfileWithEffectiveProcessors(twinfile: Record<string, unknown>): Record<string, unknown> {
  if (ProcessorGraph.parseTwinfile(twinfile)) return twinfile;
  return applyProcessorGraphToTwinfile({ ...twinfile }, DEFAULT_PLACE_PROCESSOR_GRAPH);
}

export function validatePlaceTypeV1(value: unknown): Result<PlaceTypeV1, TwinError[]> {
  const validated = validatePlaceTypeValue(getDefaultValidator(), value);
  if (!validated.ok) return validated;
  return { ok: true, value: validated.value as PlaceTypeV1 };
}
