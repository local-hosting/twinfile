import type { PatchGraphV1 } from './patch-graph.js';
import type { TwinMessageV1 } from './twin-message.js';
import type { EventPulseKind } from './event-pulse.js';

export type PatchCordId = string;

export type ContextEventState = {
  ref: string;
  enabled: boolean;
  phase?: string;
  pulse?: EventPulseKind;
  args?: Record<string, unknown>;
  /** Default inlet for pulses (module.port). */
  target?: { module: string; port: string };
};

/** Workbench session / host project slice (JSON-serializable). */
export type ContextSlice = {
  signals?: Record<string, unknown>;
  events?: ContextEventState[];
  cuts?: PatchCordId[];
  feeds?: Array<{
    virtualModule: string;
    port: string;
    wire: string;
    value: unknown;
    to: { module: string; port: string };
  }>;
  clock?: string;
};

export type PatchTraceEntry = {
  seq: number;
  at?: string;
  message: TwinMessageV1;
};

export type PatchTrace = {
  entries: PatchTraceEntry[];
};

export type PatchNodeHandler = (
  port: string,
  message: TwinMessageV1,
) => TwinMessageV1[] | void;

export type PatchProgramBuiltInput = {
  twinfile: Record<string, unknown>;
  place: Record<string, unknown>;
  events?: Record<string, unknown>[];
};

export type PatchGraphWireView = PatchGraphV1;
