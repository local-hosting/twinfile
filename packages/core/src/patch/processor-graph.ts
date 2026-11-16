import type { PatchGraphV1 } from '../types/patch-graph.js';
import type { Result } from '../types/twin-error.js';
import { err, ok } from '../types/twin-error.js';

import {
  buildProcessorsResourceFromGraph,
  type BuildProcessorsResourceOptions,
} from './build-processors-resource.js';
import { parseModuleGraphFromTwinfile } from './module-graph-twinfile.js';
import type { ProcessorsResourceV1 } from '../types/processors-resource.js';
import {
  type ProcessorGraphStats,
  validateProcessorGraph,
} from './processor-graph-validate.js';

export type { ProcessorGraphStats } from './processor-graph-validate.js';

/** Parsed processor wiring from a Twinfile manifest (optional validate against merged place). */
export class ProcessorGraph {
  readonly graph: PatchGraphV1;

  private constructor(graph: PatchGraphV1) {
    this.graph = {
      modules: [...graph.modules],
      connections: [...(graph.connections ?? [])],
    };
  }

  /** Resolve manifest `processors:` (or legacy shapes) without semantic validation. */
  static parseTwinfile(twinfile: Record<string, unknown>): ProcessorGraph | undefined {
    const graph = parseModuleGraphFromTwinfile(twinfile);
    if (!graph?.modules?.length) return undefined;
    return new ProcessorGraph(graph);
  }

  /** Parse and validate against merged `place` (or any built place object). */
  static fromTwinfile(
    twinfile: Record<string, unknown>,
    mergedPlace: Record<string, unknown>,
  ): Result<ProcessorGraphStats & { graph?: ProcessorGraph }> {
    const doc = ProcessorGraph.parseTwinfile(twinfile);
    if (!doc) return ok({ processorCount: 0, outletCount: 0 });
    const checked = validateProcessorGraph(doc.graph, twinfile, mergedPlace);
    if (!checked.ok) return err(checked.errors);
    return ok({
      ...checked.value,
      graph: doc,
    });
  }

  validate(
    twinfile: Record<string, unknown>,
    mergedPlace: Record<string, unknown>,
  ): Result<ProcessorGraphStats> {
    const checked = validateProcessorGraph(this.graph, twinfile, mergedPlace);
    if (!checked.ok) return err(checked.errors);
    return ok(checked.value);
  }

  toResource(options: BuildProcessorsResourceOptions = {}): ProcessorsResourceV1 {
    return buildProcessorsResourceFromGraph(this.graph, options);
  }
}
