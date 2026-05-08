/** Situation pulse shape on `TwinMessageV1.payload` (wire `twin:situation`). */
export type SituationPulseKind = 'fast' | 'long';

export type SituationPulseEdge = 'enter' | 'exit' | 'tick';

export type SituationPulsePayload = {
  situationRef: string;
  phase: string;
  pulse: SituationPulseKind;
  edge: SituationPulseEdge;
  args?: Record<string, unknown>;
  until?: string;
  duration?: string;
};

export type BuildSituationMessageInput = {
  situationHead: Record<string, unknown>;
  situationRef?: string;
  phase: string;
  pulse: SituationPulseKind;
  edge: SituationPulseEdge;
  at?: string;
  seq?: number;
  args?: Record<string, unknown>;
  until?: string;
  from?: { module: string; port: string };
  to?: { module: string; port: string };
};
