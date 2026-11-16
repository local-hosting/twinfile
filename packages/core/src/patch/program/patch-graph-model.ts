import type { PatchConnection, PatchGraphV1, PatchModuleTypeCatalog } from '../../types/patch-graph.js';
import type { PatchEndpoint } from '../../types/patch-graph.js';
import type { Result } from '../../types/twin-error.js';
import { err, ok } from '../../types/twin-error.js';
import { disconnectCordId, disconnectPort, patchCordId, tryConnectPorts } from '../processor-graph-edit.js';
import { validateProcessorGraph, type ProcessorGraphStats } from '../processor-graph-validate.js';
import { loadPatchModuleTypeCatalog } from '../module-type-catalog.js';
import { PatchCord } from './patch-cord.js';

export class PatchGraphModel {
  readonly catalog: PatchModuleTypeCatalog;
  private graph: PatchGraphV1;

  constructor(graph: PatchGraphV1, catalog?: PatchModuleTypeCatalog) {
    this.graph = {
      modules: [...graph.modules],
      connections: [...(graph.connections ?? [])],
    };
    this.catalog = catalog ?? loadPatchModuleTypeCatalog();
  }

  get raw(): PatchGraphV1 {
    return this.graph;
  }

  module(id: string) {
    return this.graph.modules.find((m) => m.id === id);
  }

  cords(): PatchCord[] {
    return (this.graph.connections ?? []).map((c) => new PatchCord(c));
  }

  cord(id: string): PatchCord | undefined {
    return this.cords().find((c) => c.id === id);
  }

  outletsFrom(endpoint: PatchEndpoint): PatchConnection[] {
    return (this.graph.connections ?? []).filter(
      (c) => c.from.module === endpoint.module && c.from.port === endpoint.port,
    );
  }

  inletsTo(endpoint: PatchEndpoint): PatchConnection[] {
    return (this.graph.connections ?? []).filter(
      (c) => c.to.module === endpoint.module && c.to.port === endpoint.port,
    );
  }

  connect(from: PatchEndpoint, to: PatchEndpoint): Result<PatchGraphV1> {
    const next = tryConnectPorts(this.graph, from, to, this.catalog);
    if (!next.ok) return next;
    this.graph = next.value;
    return next;
  }

  disconnect(from: PatchEndpoint, to: PatchEndpoint): void {
    this.graph = disconnectPort(this.graph, from, to);
  }

  disconnectById(cordId: string): void {
    this.graph = disconnectCordId(this.graph, cordId);
  }

  isCordActive(cordId: string, cuts?: Set<string>): boolean {
    if (cuts?.has(cordId)) return false;
    return (this.graph.connections ?? []).some((c) => patchCordId(c.from, c.to) === cordId);
  }

  validatePlace(
    twinfile: Record<string, unknown>,
    place: Record<string, unknown>,
  ): Result<ProcessorGraphStats> {
    const checked = validateProcessorGraph(this.graph, twinfile, place, this.catalog);
    if (!checked.ok) return err(checked.errors);
    return ok(checked.value);
  }
}
