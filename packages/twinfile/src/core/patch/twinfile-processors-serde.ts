import type { ManifestProcessor } from '../types/twinfile-processors.js';
import type { PatchGraphV1 } from '../types/patch-graph.js';

import { normalizeModuleGraphManifestKeys } from './module-graph-twinfile.js';

function processorList(twinfile: Record<string, unknown>): ManifestProcessor[] {
  if (!Array.isArray(twinfile.processors)) return [];
  return twinfile.processors as ManifestProcessor[];
}

/** Canonical `processors:` rows from a resolved graph (inverse of `graphFromProcessors`). */
export function twinfileProcessorsFromGraph(graph: PatchGraphV1): ManifestProcessor[] {
  const byId = new Map<string, ManifestProcessor>();
  for (const mod of graph.modules) {
    byId.set(mod.id, {
      id: mod.id,
      type: mod.type,
      ...(mod.config ? { config: mod.config } : {}),
      ...(mod.bind ? { bind: mod.bind } : {}),
    });
  }
  for (const conn of graph.connections ?? []) {
    const proc = byId.get(conn.from.module);
    if (!proc) continue;
    const outlets = [...(proc.outlets ?? [])];
    const wire = {
      port: conn.from.port,
      to: { processor: conn.to.module, port: conn.to.port },
    };
    const dup = outlets.some(
      (row) =>
        row.port === wire.port &&
        row.to.processor === wire.to.processor &&
        row.to.port === wire.to.port,
    );
    if (!dup) outlets.push(wire);
    proc.outlets = outlets;
  }
  const sorted = [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));
  return sorted.map((proc) => ({
    ...proc,
    ...(proc.outlets?.length ? { outlets: proc.outlets } : {}),
  }));
}

export function setTwinfileProcessors(
  twinfile: Record<string, unknown>,
  processors: ManifestProcessor[],
): void {
  delete twinfile.patch;
  delete twinfile.inputs;
  delete twinfile.outputs;
  delete twinfile.connections;
  if (processors.length === 0) {
    delete twinfile.processors;
    return;
  }
  twinfile.processors = processors;
}

/** Replace wiring on a manifest copy; normalizes legacy patch keys away. */
export function applyProcessorGraphToTwinfile(
  twinfile: Record<string, unknown>,
  graph: PatchGraphV1,
): Record<string, unknown> {
  const out = { ...twinfile };
  setTwinfileProcessors(out, twinfileProcessorsFromGraph(graph));
  return normalizeModuleGraphManifestKeys(out);
}

export function upsertTwinfileProcessor(
  twinfile: Record<string, unknown>,
  processor: ManifestProcessor,
): void {
  const list = processorList(twinfile);
  const at = list.findIndex((row) => row.id === processor.id);
  if (at >= 0) list[at] = processor;
  else list.push(processor);
  list.sort((a, b) => a.id.localeCompare(b.id));
  setTwinfileProcessors(twinfile, list);
}

export function removeTwinfileProcessor(twinfile: Record<string, unknown>, processorId: string): boolean {
  const list = processorList(twinfile);
  const next = list.filter((row) => row.id !== processorId);
  if (next.length === list.length) return false;
  for (const row of next) {
    if (!row.outlets) continue;
    row.outlets = row.outlets.filter((wire) => wire.to.processor !== processorId);
    if (row.outlets.length === 0) delete row.outlets;
  }
  setTwinfileProcessors(twinfile, next);
  return true;
}
