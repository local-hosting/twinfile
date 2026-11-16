import { parseManifestPatches } from '@doppler-group/twinfile-core';
import { situationBindingsFromBuilt } from './situation-bindings.js';
import { loadPatchModuleTypeCatalog } from '@doppler-group/twinfile-core';
import { patchGraphBoundaryIo } from '@doppler-group/twinfile-core';
import type { PatchGraphV1 } from '@doppler-group/twinfile-core';
import type {
  PlaceControlAcceptV1,
  PlaceDataPortV1,
  PlaceLogicalPortV1,
  PlaceTypeV1,
} from '@doppler-group/twinfile-core';
import type { TwinfileSummaryIoPort } from '@doppler-group/twinfile-core';
import { hostPortFromHubInlet, hostPortFromHubOutlet } from './host-signal-ports.js';
import { controlTypeForId } from './place-controls.js';
import {
  DEFAULT_SIGNAL_HUB_ID,
  effectiveProcessorGraph,
} from './place-type-defaults.js';

export type BuildPlaceTypeInput = {
  twinfile: Record<string, unknown>;
  place?: Record<string, unknown>;
};

const LOGICAL_OUTPUTS = [
  {
    id: 'place.merged',
    wire: 'place:merged',
    detail: 'Merged place (`Place.data`)',
  },
] as const;

function controlIdsFromBindingsAndSteps(twinfile: Record<string, unknown>, place?: Record<string, unknown>): string[] {
  const ids = new Set<string>();
  const bindings = place ? situationBindingsFromBuilt(place) : situationBindingsFromBuilt({});
  for (const forId of Object.keys(bindings)) {
    if (forId.length > 0) ids.add(forId);
  }
  for (const row of parseManifestPatches(twinfile).situationBindings) {
    const target = row.doc.for;
    if (typeof target === 'string' && target.length > 0) ids.add(target);
  }
  return [...ids].sort();
}

/** Generated capability surface for a built place (controls + open patch ports). */
export class PlaceType {
  readonly schema = 'twinfile.place-type.v1' as const;
  readonly controls: readonly PlaceControlAcceptV1[];
  readonly dataInlets: readonly PlaceDataPortV1[];
  readonly dataOutlets: readonly PlaceDataPortV1[];
  readonly logicalOutputs: readonly PlaceLogicalPortV1[];

  private constructor(spec: {
    controls: PlaceControlAcceptV1[];
    dataInlets: PlaceDataPortV1[];
    dataOutlets: PlaceDataPortV1[];
    logicalOutputs: PlaceLogicalPortV1[];
  }) {
    this.controls = spec.controls;
    this.dataInlets = spec.dataInlets;
    this.dataOutlets = spec.dataOutlets;
    this.logicalOutputs = spec.logicalOutputs;
  }

  static fromBuilt(input: BuildPlaceTypeInput): PlaceType {
    const graph = effectiveProcessorGraph(input.twinfile);
    const catalog = loadPatchModuleTypeCatalog();
    const boundary = patchGraphBoundaryIo(graph, catalog);
    const hubId = signalHubModuleId(graph);
    const controlIds = controlIdsFromBindingsAndSteps(input.twinfile, input.place);
    const controls: PlaceControlAcceptV1[] = controlIds.map((id) => {
      const ctl = controlTypeForId(id);
      return {
        id: ctl.id,
        wire: ctl.wire,
        ...(ctl.phases.length > 0 ? { phases: [...ctl.phases] } : {}),
        inlet: { module: hubId, port: ctl.defaultInletPort },
      };
    });
    return new PlaceType({
      controls,
      dataInlets: boundary.inlets,
      dataOutlets: boundary.dataOutlets,
      logicalOutputs: [...LOGICAL_OUTPUTS],
    });
  }

  static fromJSON(json: unknown): PlaceType | undefined {
    if (!json || typeof json !== 'object') return undefined;
    const row = json as PlaceTypeV1;
    if (row.schema !== 'twinfile.place-type.v1') return undefined;
    return new PlaceType({
      controls: row.controls ?? [],
      dataInlets: row.dataInlets ?? [],
      dataOutlets: row.dataOutlets ?? [],
      logicalOutputs: row.logicalOutputs ?? [...LOGICAL_OUTPUTS],
    });
  }

  acceptsControl(id: string): boolean {
    return this.controls.some((c) => c.id === id);
  }

  toJSON(): PlaceTypeV1 {
    return {
      schema: this.schema,
      controls: [...this.controls],
      dataInlets: [...this.dataInlets],
      dataOutlets: [...this.dataOutlets],
      logicalOutputs: [...this.logicalOutputs],
    };
  }

  /** Open signal-hub host ports (labels from wire ids). */
  toHostIo(): { inputs: TwinfileSummaryIoPort[]; outputs: TwinfileSummaryIoPort[] } {
    const inputs: TwinfileSummaryIoPort[] = this.dataInlets
      .filter((row) => row.module === DEFAULT_SIGNAL_HUB_ID)
      .map((row) => hostPortFromHubInlet(row));
    const outputs: TwinfileSummaryIoPort[] = this.dataOutlets
      .filter((row) => row.module === DEFAULT_SIGNAL_HUB_ID)
      .map((row) => hostPortFromHubOutlet(row));
    return { inputs, outputs };
  }
}

function signalHubModuleId(graph: PatchGraphV1): string {
  const hub = graph.modules.find((m) => m.type === 'twinfile/mod.signal-hub@0.1.0');
  return hub?.id ?? DEFAULT_SIGNAL_HUB_ID;
}
