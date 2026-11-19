import type { TwinMessageV1 } from '../types/twin-message.js';
import type { BuildEventMessageInput, EventPulsePayload } from '../types/event-pulse.js';
import { err, ok, type Result } from '../types/twin-error.js';
import type { TwinError } from '../types/twin-error.js';

function eventRef(head: Record<string, unknown>, override?: string): string {
  if (override) return override;
  const id = typeof head.id === 'string' ? head.id : 'event';
  const version = typeof head.version === 'string' ? head.version : '0.0.0';
  return `twinfile/event/${id}:${version}`;
}

export function buildEventMessage(
  input: BuildEventMessageInput,
): Result<TwinMessageV1, TwinError[]> {
  const head = input.eventHead;
  const phases = Array.isArray(head.phases)
    ? head.phases.filter((p): p is string => typeof p === 'string')
    : [];
  const errors: TwinError[] = [];
  if (phases.length > 0 && !phases.includes(input.phase)) {
    errors.push({
      code: 'E_EVENT',
      message: `phase "${input.phase}" not in event phases (${phases.join(', ')})`,
    });
  }
  if (input.pulse === 'long' && input.edge === 'enter' && !input.until) {
    errors.push({
      code: 'E_EVENT',
      message: 'long pulse with edge enter requires until',
    });
  }
  const argDefs = head.args as Record<string, unknown> | undefined;
  if (argDefs && input.args) {
    for (const key of Object.keys(input.args)) {
      if (!(key in argDefs)) {
        errors.push({
          code: 'E_EVENT',
          message: `unknown event arg "${key}"`,
        });
      }
    }
  }
  if (errors.length) return err(errors);

  const payload: EventPulsePayload = {
    eventRef: eventRef(head, input.eventRef),
    phase: input.phase,
    pulse: input.pulse,
    edge: input.edge,
    ...(input.args ? { args: input.args } : {}),
    ...(input.until ? { until: input.until } : {}),
  };

  const message: TwinMessageV1 = {
    twinfile: 1,
    kind: 'message',
    v: 1,
    wire: 'twin:event',
    payload,
    ...(input.at ? { at: input.at } : {}),
    ...(input.seq !== undefined ? { seq: input.seq } : {}),
    ...(input.from ? { from: input.from } : {}),
    ...(input.to ? { to: input.to } : {}),
  };
  return ok(message);
}
