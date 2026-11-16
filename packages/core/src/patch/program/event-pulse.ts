import { buildEventMessage } from '../build-event-message.js';
import type { BuildEventMessageInput, EventPulseEdge, EventPulseKind } from '../../types/event-pulse.js';
import type { PatchNodeHandler } from '../../types/patch-program.js';
import type { TwinMessageV1 } from '../../types/twin-message.js';
import type { Result } from '../../types/twin-error.js';
import type { TwinError } from '../../types/twin-error.js';

export class EventPulse {
  readonly eventHead: Record<string, unknown>;
  readonly phase: string;
  readonly pulse: EventPulseKind;
  readonly edge: EventPulseEdge;
  readonly args?: Record<string, unknown>;
  readonly until?: string;
  readonly to?: { module: string; port: string };

  constructor(
    eventHead: Record<string, unknown>,
    spec: {
      phase: string;
      pulse: EventPulseKind;
      edge: EventPulseEdge;
      args?: Record<string, unknown>;
      until?: string;
      to?: { module: string; port: string };
    },
  ) {
    this.eventHead = eventHead;
    this.phase = spec.phase;
    this.pulse = spec.pulse;
    this.edge = spec.edge;
    this.args = spec.args;
    this.until = spec.until;
    this.to = spec.to;
  }

  enter(at?: string, seq?: number): Result<TwinMessageV1, TwinError[]> {
    return this.message('enter', at, seq);
  }

  exit(at?: string, seq?: number): Result<TwinMessageV1, TwinError[]> {
    return this.message('exit', at, seq);
  }

  private message(edge: EventPulseEdge, at?: string, seq?: number): Result<TwinMessageV1, TwinError[]> {
    const input: BuildEventMessageInput = {
      eventHead: this.eventHead,
      phase: this.phase,
      pulse: this.pulse,
      edge,
      args: this.args,
      until: this.until,
      at,
      seq,
      from: { module: 'context', port: String(this.eventHead.id ?? 'event') },
      ...(this.to ? { to: this.to } : {}),
    };
    return buildEventMessage(input);
  }

  /** Long pulse: enter now, exit at `until` when provided. */
  pair(at?: string, seq?: number): Result<TwinMessageV1[], TwinError[]> {
    const enter = this.enter(at, seq);
    if (!enter.ok) return enter as Result<TwinMessageV1[], TwinError[]>;
    if (this.pulse !== 'long' || !this.until) {
      return { ok: true, value: [enter.value] };
    }
    const exit = this.exit(this.until, seq !== undefined ? seq + 1 : undefined);
    if (!exit.ok) return exit as Result<TwinMessageV1[], TwinError[]>;
    return { ok: true, value: [enter.value, exit.value] };
  }
}

export type EventPulseHandlerOptions = {
  /** Next hop when YAML omits an explicit `outlets` wire (tests / minimal graphs). */
  alertTo?: { module: string; port: string };
};

/** Default inlet handler for `mod.event-in`: forward `twin:event` as `signal:alert`. */
export function eventPulseHandler(options: EventPulseHandlerOptions = {}): PatchNodeHandler {
  return (port, message) => {
    if (port !== 'in' || message.wire !== 'twin:event') return;
    const moduleId = message.to?.module ?? 'context-events';
    return [
      {
        ...message,
        wire: 'signal:alert',
        from: { module: moduleId, port: 'alert' },
        ...(options.alertTo ? { to: options.alertTo } : {}),
      },
    ];
  };
}
