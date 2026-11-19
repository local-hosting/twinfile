import type {
  PatchEndpoint,
  PatchGraphV1,
  PatchModuleTypeCatalog,
  PatchPortDef,
} from '../types/patch-graph.js';
import {
  TWINFILE_PATCH_UI_SCHEMA,
  type PatchUiConnection,
  type PatchUiModel,
  type PatchUiModule,
  type PatchUiPort,
} from '../types/processor-ui.js';

export type { PatchUiConnection, PatchUiModel, PatchUiModule, PatchUiPort } from '../types/processor-ui.js';

function portsForModule(
  moduleId: string,
  type: string,
  catalog: PatchModuleTypeCatalog,
): { inputs: PatchUiPort[]; outputs: PatchUiPort[] } {
  const def = catalog[type]?.ports ?? {};
  const inputs: PatchUiPort[] = [];
  const outputs: PatchUiPort[] = [];
  for (const [port, row] of Object.entries(def)) {
    if (row.facet === 'internal') continue;
    const base: PatchUiPort = { moduleId, port, wire: row.wire, direction: row.direction };
    if (row.direction === 'in') inputs.push(base);
    else outputs.push(base);
  }
  inputs.sort((a, b) => a.port.localeCompare(b.port));
  outputs.sort((a, b) => a.port.localeCompare(b.port));
  return { inputs, outputs };
}

function resolveWire(
  endpoint: PatchEndpoint,
  direction: 'out' | 'in',
  modulesById: Map<string, PatchGraphV1['modules'][number]>,
  catalog: PatchModuleTypeCatalog,
): string | null {
  const mod = modulesById.get(endpoint.module);
  if (!mod) return null;
  const ports = catalog[mod.type]?.ports;
  const port: PatchPortDef | undefined = ports?.[endpoint.port];
  if (!port || port.direction !== direction) return null;
  return port.wire;
}

/**
 * Stable graph projection for patch canvas UIs (module columns, wires, inspectors).
 * Hosts supply layout coordinates; this object is wiring truth only (no DOM / framework).
 */
export function projectPatchGraphForUi(
  patch: PatchGraphV1 | undefined,
  catalog: PatchModuleTypeCatalog,
): PatchUiModel {
  const modules: PatchUiModule[] = [];
  const modulesById = new Map<string, PatchGraphV1['modules'][number]>();
  for (const mod of patch?.modules ?? []) {
    modulesById.set(mod.id, mod);
    const { inputs, outputs } = portsForModule(mod.id, mod.type, catalog);
    modules.push({
      id: mod.id,
      type: mod.type,
      bind: mod.bind,
      inputs,
      outputs,
    });
  }
  modules.sort((a, b) => a.id.localeCompare(b.id));

  const connections: PatchUiConnection[] = [];
  for (const conn of patch?.connections ?? []) {
    const outWire = resolveWire(conn.from, 'out', modulesById, catalog);
    const inWire = resolveWire(conn.to, 'in', modulesById, catalog);
    connections.push({
      ...conn,
      wire: outWire && inWire && outWire === inWire ? outWire : outWire ?? inWire,
    });
  }

  return { schema: TWINFILE_PATCH_UI_SCHEMA, modules, connections };
}
