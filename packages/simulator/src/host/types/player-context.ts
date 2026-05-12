/** Serializable slice for patch publish (maps to core `ContextSlice`). */
export type PlayerContextPulse = {
  pulses?: Array<{
    ref: string;
    phase: string;
    edge: 'enter' | 'exit';
    pulse?: 'fast' | 'long';
  }>;
  situations?: Array<{
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

export type PlayerPatchPublishResult =
  | { ok: true; messageCount: number; wires: string[] }
  | { ok: false; error: string };
