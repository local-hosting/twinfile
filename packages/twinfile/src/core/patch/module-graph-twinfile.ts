import { normalizeComposeTwinfileKeys } from '../load/twinfile-compose.js';
import type { ManifestProcessor, ProcessorOutletWire } from '../types/twinfile-processors.js';
import type { PatchConnection, PatchGraphV1, PatchModule } from '../types/patch-graph.js';
import { isRecord } from '../doc/is-record.js';

function endpointModule(row: Record<string, unknown>): string | undefined {
  if (typeof row.processor === 'string') return row.processor;
  if (typeof row.module === 'string') return row.module;
  return undefined;
}

function patchModuleFromRow(row: Record<string, unknown>): PatchModule | undefined {
  if (typeof row.id !== 'string' || typeof row.type !== 'string') return undefined;
  return {
    id: row.id,
    type: row.type,
    ...(isRecord(row.config) ? { config: row.config } : {}),
    ...(isRecord(row.bind) ? { bind: row.bind as Record<string, string> } : {}),
  };
}

function outletWires(value: unknown): ProcessorOutletWire[] {
  if (!Array.isArray(value)) return [];
  const out: ProcessorOutletWire[] = [];
  for (const row of value) {
    if (!isRecord(row) || typeof row.port !== 'string') continue;
    const to = row.to;
    if (!isRecord(to)) continue;
    const processor = endpointModule(to);
    const port = typeof to.port === 'string' ? to.port : undefined;
    if (!processor || !port) continue;
    out.push({ port: row.port, to: { processor, port } });
  }
  return out;
}

function manifestProcessors(value: unknown): ManifestProcessor[] {
  if (!Array.isArray(value)) return [];
  const out: ManifestProcessor[] = [];
  for (const row of value) {
    if (!isRecord(row)) continue;
    const base = patchModuleFromRow(row);
    if (!base) continue;
    const outlets = outletWires(row.outlets);
    out.push({ ...base, ...(outlets.length > 0 ? { outlets } : {}) });
  }
  return out;
}

function connectionList(value: unknown): PatchConnection[] {
  if (!Array.isArray(value)) return [];
  const out: PatchConnection[] = [];
  for (const row of value) {
    if (!isRecord(row) || !isRecord(row.from) || !isRecord(row.to)) continue;
    const fromMod = endpointModule(row.from);
    const toMod = endpointModule(row.to);
    const fromPort = typeof row.from.port === 'string' ? row.from.port : undefined;
    const toPort = typeof row.to.port === 'string' ? row.to.port : undefined;
    if (!fromMod || !toMod || !fromPort || !toPort) continue;
    out.push({ from: { module: fromMod, port: fromPort }, to: { module: toMod, port: toPort } });
  }
  return out;
}

function moduleList(value: unknown): PatchModule[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((row) => (isRecord(row) ? patchModuleFromRow(row) ?? [] : []));
}

function graphFromProcessors(processors: ManifestProcessor[]): PatchGraphV1 | undefined {
  if (processors.length === 0) return undefined;
  const modules: PatchModule[] = processors.map(({ id, type, config, bind }) => ({
    id,
    type,
    ...(config ? { config } : {}),
    ...(bind ? { bind } : {}),
  }));
  const connections: PatchConnection[] = [];
  for (const proc of processors) {
    for (const wire of proc.outlets ?? []) {
      connections.push({
        from: { module: proc.id, port: wire.port },
        to: { module: wire.to.processor, port: wire.to.port },
      });
    }
  }
  return { modules, connections };
}

/** Attach `connections` / legacy rows as `outlets` on the source processor. */
function outletsFromConnections(
  processors: ManifestProcessor[],
  connections: PatchConnection[],
): ManifestProcessor[] {
  if (connections.length === 0) return processors;
  const byId = new Map(processors.map((p) => [p.id, { ...p, outlets: [...(p.outlets ?? [])] }]));
  for (const conn of connections) {
    const proc = byId.get(conn.from.module);
    if (!proc) continue;
    const wire: ProcessorOutletWire = {
      port: conn.from.port,
      to: { processor: conn.to.module, port: conn.to.port },
    };
  const dup = proc.outlets.some(
    (o) => o.port === wire.port && o.to.processor === wire.to.processor && o.to.port === wire.to.port,
  );
    if (!dup) proc.outlets.push(wire);
    byId.set(proc.id, proc);
  }
  return [...byId.values()].map((p) => ({ ...p, ...(p.outlets.length > 0 ? { outlets: p.outlets } : {}) }));
}

function legacyProcessors(twinfile: Record<string, unknown>): ManifestProcessor[] {
  const patch = twinfile.patch;
  if (isRecord(patch) && Array.isArray(patch.modules)) {
    const procs = manifestProcessors(
      (patch.modules as unknown[]).map((row) => (isRecord(row) ? row : {})),
    );
    return outletsFromConnections(procs, connectionList(patch.connections));
  }

  const split = [...moduleList(twinfile.inputs), ...moduleList(twinfile.outputs)].map((m) => ({
    id: m.id,
    type: m.type,
    ...(m.config ? { config: m.config } : {}),
    ...(m.bind ? { bind: m.bind } : {}),
  } satisfies ManifestProcessor));
  if (split.length === 0) return [];
  return outletsFromConnections(split, connectionList(twinfile.connections));
}

/** Resolved `processors:` rows (`processors:` plus legacy manifest shapes). */
export function resolveManifestProcessorsFromTwinfile(twinfile: Record<string, unknown>): ManifestProcessor[] {
  let processors = manifestProcessors(twinfile.processors);
  if (processors.length === 0) {
    processors = legacyProcessors(twinfile);
  } else {
    processors = outletsFromConnections(processors, connectionList(twinfile.connections));
  }
  return processors;
}

export function patchGraphFromManifestProcessors(processors: ManifestProcessor[]): PatchGraphV1 | undefined {
  if (processors.length === 0) return undefined;
  return graphFromProcessors(processors);
}

/** Resolve manifest wiring to `PatchGraphV1` (`processors:` or legacy shapes). */
export function parseModuleGraphFromTwinfile(twinfile: Record<string, unknown>): PatchGraphV1 | undefined {
  return patchGraphFromManifestProcessors(resolveManifestProcessorsFromTwinfile(twinfile));
}

/** Canonical twinfile: `processors:` with `outlets:`; drops legacy wiring keys. */
export function normalizeModuleGraphManifestKeys(twinfile: Record<string, unknown>): Record<string, unknown> {
  let processors = resolveManifestProcessorsFromTwinfile(twinfile);

  const out: Record<string, unknown> = { ...twinfile };
  delete out.patch;
  delete out.inputs;
  delete out.outputs;
  delete out.connections;
  if (processors.length > 0) out.processors = processors;
  else delete out.processors;
  return out;
}

export function normalizeManifestV2Keys(twinfile: Record<string, unknown>): Record<string, unknown> {
  let out = normalizeComposeTwinfileKeys(twinfile);
  out = normalizeModuleGraphManifestKeys(out);
  return out;
}
