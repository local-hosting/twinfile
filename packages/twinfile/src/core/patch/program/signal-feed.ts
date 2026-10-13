import type { TwinMessageV1 } from '../../types/twin-message.js';

export type SignalFeedInput = {
  wire: string;
  value: unknown;
  virtualModule: string;
  port: string;
  to: { module: string; port: string };
  at?: string;
  seq?: number;
};

export class SignalFeed {
  readonly wire: string;
  readonly value: unknown;
  readonly virtualModule: string;
  readonly port: string;
  readonly to: { module: string; port: string };

  constructor(input: SignalFeedInput) {
    this.wire = input.wire;
    this.value = input.value;
    this.virtualModule = input.virtualModule;
    this.port = input.port;
    this.to = input.to;
  }

  toMessage(at?: string, seq?: number): TwinMessageV1 {
    return {
      twinfile: 1,
      kind: 'message',
      v: 1,
      wire: this.wire,
      from: { module: this.virtualModule, port: this.port },
      to: this.to,
      payload: { value: this.value },
      ...(at ? { at } : {}),
      ...(seq !== undefined ? { seq } : {}),
    };
  }
}
