import { ProcessorGraph } from '../patch/processor-graph.js';
import type { Result } from '../types/twin-error.js';
import { ok } from '../types/twin-error.js';

export function checkProcessorGraph(
  twinfile: Record<string, unknown>,
  mergedPlace: Record<string, unknown>,
): Result<{ processorCount: number; outletCount: number }> {
  const result = ProcessorGraph.fromTwinfile(twinfile, mergedPlace);
  if (!result.ok) return result;
  const { graph: _graph, ...stats } = result.value;
  return ok(stats);
}
