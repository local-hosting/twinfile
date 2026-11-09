/** Environment slice for host player (`applyPlayerContextPulse` in `@local-hosting/twinfile-simulator/host`). */
export type WorkbenchEnvironmentSlice = {
  /** One-shot pulses (enter/exit) without enabling a long-lived event state. */
  pulses?: Array<{
    ref: string;
    phase: string;
    edge: 'enter' | 'exit';
    pulse?: 'fast' | 'long';
  }>;
  events?: Array<{
    ref: string;
    enabled: boolean;
    phase?: string;
    pulse?: 'fast' | 'long';
    target?: { module: string; port: string };
  }>;
  signals?: Record<string, unknown>;
  feeds?: Array<{
    virtualModule: string;
    port: string;
    wire: string;
    value: unknown;
    to: { module: string; port: string };
  }>;
};

export type WorkbenchContextPulseResponse = {
  schema: 'twinfile.viewer.context.pulse.v1';
  ok: boolean;
  messageCount: number;
  wires: string[];
  error?: string;
};

export const WORKBENCH_SIGNAL_WIRES = [
  'signal:rain',
  'signal:alert',
  'signal:rating',
  'signal:volume',
  'signal:open',
  'signal:trigger',
  'signal:status',
  'signal:occupancy',
] as const;

export type WorkbenchSignalWire = (typeof WORKBENCH_SIGNAL_WIRES)[number];
