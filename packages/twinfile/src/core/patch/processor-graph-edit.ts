import type { PatchGraphV1 } from '../types/patch-graph.js';
import type { PatchEndpoint, PatchModuleTypeCatalog } from '../types/patch-graph.js';
import type { Result } from '../types/twin-error.js';
import { err, ok } from '../types/twin-error.js';

import { loadPatchModuleTypeCatalog } from './module-type-catalog.js';
import { connectionFromEndpoints, validateProcessorConnection } from './processor-graph-validate.js';

export function patchCordId(from: PatchEndpoint, to: PatchEndpoint): string {
  return `${from.module}.${from.port}>${to.module}.${to.port}`;
}

export function connectPorts(
  graph: PatchGraphV1,
  from: PatchEndpoint,
  to: PatchEndpoint,
): PatchGraphV1 {
  const connections = [...(graph.connections ?? [])];
  const id = patchCordId(from, to);
  const dup = connections.some((c) => patchCordId(c.from, c.to) === id);
  if (!dup) {
    connections.push({ from, to });
  }
  return { modules: [...graph.modules], connections };
}

export function tryConnectPorts(
  graph: PatchGraphV1,
  from: PatchEndpoint,
  to: PatchEndpoint,
  catalog?: PatchModuleTypeCatalog,
): Result<PatchGraphV1> {
  const errors = validateProcessorConnection(
    graph,
    connectionFromEndpoints(from, to),
    catalog ?? loadPatchModuleTypeCatalog(),
  );
  if (errors.length > 0) return err(errors);
  return ok(connectPorts(graph, from, to));
}

export function disconnectPort(
  graph: PatchGraphV1,
  from: PatchEndpoint,
  to: PatchEndpoint,
): PatchGraphV1 {
  const id = patchCordId(from, to);
  const connections = (graph.connections ?? []).filter((c) => patchCordId(c.from, c.to) !== id);
  return { modules: [...graph.modules], connections };
}

export function disconnectCordId(graph: PatchGraphV1, cordId: string): PatchGraphV1 {
  const connections = (graph.connections ?? []).filter((c) => patchCordId(c.from, c.to) !== cordId);
  return { modules: [...graph.modules], connections };
}
