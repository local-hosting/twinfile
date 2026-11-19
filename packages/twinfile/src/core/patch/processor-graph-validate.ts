import { parseManifestPatches } from '../load/twinfile-instructions.js';
import { loadPatchModuleTypeCatalog } from './module-type-catalog.js';
import type { PatchConnection, PatchEndpoint, PatchGraphV1, PatchModuleTypeCatalog, PatchPortDef } from '../types/patch-graph.js';
import type { TwinError } from '../types/twin-error.js';

const BIND_RE = /^ref:(space|asset|building):([a-z][a-z0-9.-]*)$/;

export type ProcessorGraphStats = {
  processorCount: number;
  outletCount: number;
};

function buildingAnchors(twinfile: Record<string, unknown>): Set<string> {
  const anchors = new Set<string>();
  for (const step of parseManifestPatches(twinfile).instructions) {
    if (step.type === 'copy' && step.into) anchors.add(step.into);
  }
  return anchors;
}

function placeIds(place: Record<string, unknown>): { spaces: Set<string>; assets: Set<string> } {
  const spaces = new Set<string>();
  const assets = new Set<string>();
  for (const row of (place.spaces ?? []) as Array<{ id?: string }>) {
    if (row.id) spaces.add(row.id);
  }
  for (const row of (place.assets ?? []) as Array<{ id?: string }>) {
    if (row.id) assets.add(row.id);
  }
  return { spaces, assets };
}

function catalogPorts(catalog: PatchModuleTypeCatalog, type: string): Record<string, PatchPortDef> | undefined {
  return catalog[type]?.ports;
}

function validateModuleBinds(
  mod: PatchGraphV1['modules'][number],
  ids: ReturnType<typeof placeIds>,
  anchors: Set<string>,
): TwinError[] {
  const errors: TwinError[] = [];
  for (const [key, value] of Object.entries(mod.bind ?? {})) {
    const m = BIND_RE.exec(value);
    if (!m) {
      errors.push({
        code: 'E_PROCESSOR',
        message: `bind ${key}: expected ref:space|asset|building:<id>`,
      });
      continue;
    }
    const [, kind, id] = m;
    if (kind === 'space' && !ids.spaces.has(id)) {
      errors.push({ code: 'E_PROCESSOR', message: `bind ${key}: unknown space "${id}"` });
    }
    if (kind === 'asset' && !ids.assets.has(id)) {
      errors.push({ code: 'E_PROCESSOR', message: `bind ${key}: unknown asset "${id}"` });
    }
    if (kind === 'building') {
      if (!anchors.has(id)) {
        errors.push({
          code: 'E_PROCESSOR',
          message: `bind ${key}: no copy: instruction copies a building into "${id}"`,
        });
      } else if (!ids.spaces.has(id)) {
        errors.push({
          code: 'E_PROCESSOR',
          message: `bind ${key}: building anchor "${id}" is not a merged space (declare it in an earlier step)`,
        });
      }
    }
  }
  return errors;
}

function validateOneConnection(
  conn: PatchConnection,
  modulesById: Map<string, PatchGraphV1['modules'][number]>,
  catalog: PatchModuleTypeCatalog,
): TwinError[] {
  const errors: TwinError[] = [];
  const fromMod = modulesById.get(conn.from.module);
  const toMod = modulesById.get(conn.to.module);
  if (!fromMod) {
    errors.push({ code: 'E_PROCESSOR', message: `outlet from unknown processor "${conn.from.module}"` });
    return errors;
  }
  if (!toMod) {
    errors.push({ code: 'E_PROCESSOR', message: `outlet to unknown processor "${conn.to.module}"` });
    return errors;
  }
  const fromPorts = catalogPorts(catalog, fromMod.type);
  const toPorts = catalogPorts(catalog, toMod.type);
  const fromPort = fromPorts?.[conn.from.port];
  const toPort = toPorts?.[conn.to.port];
  if (!fromPort) {
    errors.push({
      code: 'E_PROCESSOR',
      message: `processor "${fromMod.id}": unknown port "${conn.from.port}"`,
    });
    return errors;
  }
  if (!toPort) {
    errors.push({
      code: 'E_PROCESSOR',
      message: `processor "${toMod.id}": unknown port "${conn.to.port}"`,
    });
    return errors;
  }
  if (fromPort.direction !== 'out' || toPort.direction !== 'in') {
    errors.push({
      code: 'E_PROCESSOR',
      message: `outlet ${fromMod.id}.${conn.from.port} → ${toMod.id}.${conn.to.port}: port direction mismatch`,
    });
    return errors;
  }
  if (fromPort.wire !== toPort.wire) {
    errors.push({
      code: 'E_PROCESSOR',
      message: `wire mismatch ${fromPort.wire} → ${toPort.wire}`,
    });
  }
  return errors;
}

/** Semantic checks for a resolved graph (module types, binds, outlet wires). */
export function validateProcessorGraph(
  graph: PatchGraphV1,
  twinfile: Record<string, unknown>,
  mergedPlace: Record<string, unknown>,
  catalog: PatchModuleTypeCatalog = loadPatchModuleTypeCatalog(),
): { ok: true; value: ProcessorGraphStats } | { ok: false; errors: TwinError[] } {
  const errors: TwinError[] = [];
  const ids = placeIds(mergedPlace);
  const anchors = buildingAnchors(twinfile);
  const modulesById = new Map<string, PatchGraphV1['modules'][number]>();

  for (const mod of graph.modules ?? []) {
    if (modulesById.has(mod.id)) {
      errors.push({ code: 'E_PROCESSOR', message: `duplicate processor id "${mod.id}"` });
      continue;
    }
    modulesById.set(mod.id, mod);
    if (!catalogPorts(catalog, mod.type)) {
      errors.push({ code: 'E_PROCESSOR', message: `unknown processor type "${mod.type}"` });
    }
    errors.push(...validateModuleBinds(mod, ids, anchors));
  }

  for (const conn of graph.connections ?? []) {
    errors.push(...validateOneConnection(conn, modulesById, catalog));
  }

  if (errors.length > 0) return { ok: false, errors };
  return {
    ok: true,
    value: {
      processorCount: graph.modules.length,
      outletCount: graph.connections?.length ?? 0,
    },
  };
}

/** Validate a single cord before mutating an in-memory graph. */
export function validateProcessorConnection(
  graph: PatchGraphV1,
  conn: PatchConnection,
  catalog: PatchModuleTypeCatalog = loadPatchModuleTypeCatalog(),
): TwinError[] {
  const modulesById = new Map(graph.modules.map((mod) => [mod.id, mod]));
  if (!modulesById.has(conn.from.module)) {
    return [{ code: 'E_PROCESSOR', message: `outlet from unknown processor "${conn.from.module}"` }];
  }
  if (!modulesById.has(conn.to.module)) {
    return [{ code: 'E_PROCESSOR', message: `outlet to unknown processor "${conn.to.module}"` }];
  }
  return validateOneConnection(conn, modulesById, catalog);
}

export function connectionFromEndpoints(from: PatchEndpoint, to: PatchEndpoint): PatchConnection {
  return { from, to };
}
