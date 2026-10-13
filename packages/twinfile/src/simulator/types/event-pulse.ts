/** Event pulse shape on `TwinMessageV1.payload` (wire `twin:event`). */
export type EventPulseKind = 'fast' | 'long';

export type EventPulseEdge = 'enter' | 'exit' | 'tick';

export type EventPulsePayload = {
  eventRef: string;
  phase: string;
  pulse: EventPulseKind;
  edge: EventPulseEdge;
  args?: Record<string, unknown>;
  until?: string;
  duration?: string;
};

export type BuildEventMessageInput = {
  eventHead: Record<string, unknown>;
  eventRef?: string;
  phase: string;
  pulse: EventPulseKind;
  edge: EventPulseEdge;
  at?: string;
  seq?: number;
  args?: Record<string, unknown>;
  until?: string;
  from?: { module: string; port: string };
  to?: { module: string; port: string };
};
