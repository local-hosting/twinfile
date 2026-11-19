import type { PatchWire } from '../generated/patch-module-types-data.js';

/** Host patch runtime envelope ([spec twin-message.schema.json](../../../spec/schemas/1/patch/twin-message.schema.json)). */
export const TWIN_MESSAGE_SCHEMA = 'twinfile.twin-message.v1' as const;

export type TwinMessagePortRef = {
  module: string;
  port: string;
};

export type TwinMessageV1 = {
  twinfile: 1;
  kind: 'message';
  v: 1;
  wire: PatchWire | (string & {});
  payload: Record<string, unknown>;
  at?: string;
  seq?: number;
  from?: TwinMessagePortRef;
  to?: TwinMessagePortRef;
  ext?: Record<string, unknown>;
};
