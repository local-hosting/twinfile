import type { PatchGraphV1, PatchModuleTypeCatalog } from '../types/patch-graph.js';
import type { PlaceDataPortV1 } from '../types/place-type.js';
import type { TwinfileSummaryIoPort, TwinfileUseMode } from '../types/twinfile-summary.js';

/** Host-facing processor ports with no cord attached (Max/MSP open inlets/outlets). */
export function patchGraphBoundaryIo(
  graph: PatchGraphV1,
  catalog: PatchModuleTypeCatalog,
): { inlets: PlaceDataPortV1[]; dataOutlets: PlaceDataPortV1[] } {
  const inlets: PlaceDataPortV1[] = [];
  const dataOutlets: PlaceDataPortV1[] = [];
  const connections = graph.connections ?? [];
  const connectedIn = new Set(
    connections.map((c) => `${c.to.module}.${c.to.port}`),
  );
  const connectedOut = new Set(
    connections.map((c) => `${c.from.module}.${c.from.port}`),
  );
  for (const mod of graph.modules) {
    const typeDef = catalog[mod.type];
    if (!typeDef?.ports) continue;
    for (const [portName, portDef] of Object.entries(typeDef.ports)) {
      if (portDef.facet === 'internal') continue;
      const key = `${mod.id}.${portName}`;
      if (portDef.direction === 'in' && !connectedIn.has(key)) {
        inlets.push({
          id: key,
          wire: portDef.wire,
          module: mod.id,
          port: portName,
          direction: 'in',
        });
      }
      if (portDef.direction === 'out' && !connectedOut.has(key)) {
        dataOutlets.push({
          id: key,
          wire: portDef.wire,
          module: mod.id,
          port: portName,
          direction: 'out',
        });
      }
    }
  }
  inlets.sort((a, b) => a.id.localeCompare(b.id));
  dataOutlets.sort((a, b) => a.id.localeCompare(b.id));
  return { inlets, dataOutlets };
}

/** Resolved ports on the patch canvas (`connections` only), not internal module plumbing. */
export function patchModuleWireIo(
  moduleId: string,
  patch: PatchGraphV1,
  catalog: PatchModuleTypeCatalog,
): { inputs: TwinfileSummaryIoPort[]; outputs: TwinfileSummaryIoPort[] } {
  const modulesById = new Map(patch.modules.map((row) => [row.id, row]));
  const inputs: TwinfileSummaryIoPort[] = [];
  const outputs: TwinfileSummaryIoPort[] = [];
  for (const conn of patch.connections ?? []) {
    const fromMod = modulesById.get(conn.from.module);
    const toMod = modulesById.get(conn.to.module);
    const fromPort = fromMod ? catalog[fromMod.type]?.ports[conn.from.port] : undefined;
    const toPort = toMod ? catalog[toMod.type]?.ports[conn.to.port] : undefined;
    const wire = fromPort?.wire ?? toPort?.wire;
    if (conn.to.module === moduleId) {
      inputs.push({
        id: `${conn.from.module}.${conn.from.port}`,
        label: `${conn.from.module}.${conn.from.port}`,
        kind: wire,
        detail: `${fromPort?.wire ?? '?'} → this.${conn.to.port}`,
      });
    }
    if (conn.from.module === moduleId) {
      outputs.push({
        id: `${conn.to.module}.${conn.to.port}`,
        label: `${conn.to.module}.${conn.to.port}`,
        kind: wire,
        detail: `this.${conn.from.port} → ${toPort?.wire ?? '?'}`,
      });
    }
  }
  inputs.sort((a, b) => a.id.localeCompare(b.id));
  outputs.sort((a, b) => a.id.localeCompare(b.id));
  return { inputs, outputs };
}

export function patchModuleUseMode(_type: string, _catalog: PatchModuleTypeCatalog): TwinfileUseMode {
  return 'place';
}
