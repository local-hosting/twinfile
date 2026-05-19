import { SignalFeed } from '@local-hosting/twinfile-core';
import type { Result, TwinError } from '@local-hosting/twinfile-core';
import { ok, err } from '@local-hosting/twinfile-core';
import { isRecord } from '@local-hosting/twinfile-core';

function msgError(message: string): TwinError[] {
  return [{ code: 'E_MESSAGE', message }];
}

export type TransitControlPayload = {
  control: 'transit-disruption';
  phase: 'disrupted' | 'restored';
  line?: string;
};

/** Registry entry for a host control type (patch bus), not a YAML `kind: event` unit. */
export abstract class PlaceControlType {
  abstract readonly id: string;
  abstract readonly wire: string;
  abstract readonly phases: readonly string[];
  readonly defaultInletPort = 'trigger';

  abstract parsePayload(value: unknown): Result<unknown, TwinError[]>;

  buildSignalFeed(input: {
    hubModuleId: string;
    hubPort?: string;
    payload: unknown;
    virtualModule?: string;
  }): SignalFeed {
    return new SignalFeed({
      wire: this.wire,
      value: input.payload,
      virtualModule: input.virtualModule ?? 'workbench-control',
      port: this.defaultInletPort,
      to: { module: input.hubModuleId, port: input.hubPort ?? this.defaultInletPort },
    });
  }
}

export class TransitDisruptionControl extends PlaceControlType {
  readonly id = 'transit-disruption';
  readonly wire = 'signal:trigger';
  readonly phases = ['disrupted', 'restored'] as const;

  parsePayload(value: unknown): Result<TransitControlPayload, TwinError[]> {
    if (!isRecord(value)) return err(msgError('transit-disruption: expected object payload'));
    if (value.control !== this.id) {
      return err(msgError(`transit-disruption: control must be ${this.id}`));
    }
    const phase = value.phase;
    if (phase !== 'disrupted' && phase !== 'restored') {
      return err(msgError('transit-disruption: phase must be disrupted or restored'));
    }
    const line = value.line;
    if (line !== undefined && typeof line !== 'string') {
      return err(msgError('transit-disruption: line must be a string'));
    }
    return ok({
      control: this.id,
      phase,
      ...(typeof line === 'string' && line.length > 0 ? { line } : {}),
    });
  }

  payload(phase: 'disrupted' | 'restored', line?: string): TransitControlPayload {
    return {
      control: this.id,
      phase,
      ...(line?.trim() ? { line: line.trim() } : {}),
    };
  }
}

export class GenericTriggerControl extends PlaceControlType {
  readonly id: string;
  readonly wire: string;
  readonly phases: readonly string[];

  constructor(id: string, wire = 'signal:trigger', phases: readonly string[] = []) {
    super();
    this.id = id;
    this.wire = wire;
    this.phases = phases;
  }

  parsePayload(value: unknown): Result<Record<string, unknown>, TwinError[]> {
    if (!isRecord(value)) return err(msgError(`${this.id}: expected object payload`));
    return ok(value);
  }
}

const KNOWN_CONTROLS: Record<string, PlaceControlType> = {
  'transit-disruption': new TransitDisruptionControl(),
  'passenger-queue': new GenericTriggerControl('passenger-queue', 'signal:trigger', [
    'steady',
    'backlog',
    'cleared',
  ]),
};

export function controlTypeForId(id: string): PlaceControlType {
  return KNOWN_CONTROLS[id] ?? new GenericTriggerControl(id);
}

export const transitDisruptionControl = KNOWN_CONTROLS['transit-disruption'] as TransitDisruptionControl;
