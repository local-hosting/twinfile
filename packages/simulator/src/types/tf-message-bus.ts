import {
  createPatchMessageBus,
  type PatchMessageBus,
  type PatchMessageHandler,
  type TwinMessagePortRef,
  type TwinMessageV1,
} from '@local-hosting/twinfile-core';

export type { PatchMessageHandler, TwinMessagePortRef, TwinMessageV1 };

/** Patch **module bus** (`TwinMessageV1`) — FLOW / Node-RED wiring layer. */
export type TFMessageBus = PatchMessageBus;

export function createTFMessageBus(): TFMessageBus {
  return createPatchMessageBus();
}
