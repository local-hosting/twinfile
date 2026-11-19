import type { TwinMessagePortRef, TwinMessageV1 } from '../types/twin-message.js';

export type PatchMessageHandler = (message: TwinMessageV1) => void;

export type PatchMessageBus = {
  publish: (message: TwinMessageV1) => void;
  subscribe: (target: TwinMessagePortRef, handler: PatchMessageHandler) => () => void;
};

/**
 * Reference in-process bus for Phase 6 hosts (Node, tests). Production studios may replace with MQTT, Redis, etc.
 */
export function createPatchMessageBus(): PatchMessageBus {
  const routes = new Map<string, Set<PatchMessageHandler>>();
  const portKey = (ref: TwinMessagePortRef): string => `${ref.module}\0${ref.port}`;

  return {
    publish(message: TwinMessageV1): void {
      if (!message.to) return;
      const handlers = routes.get(portKey(message.to));
      if (!handlers) return;
      for (const handler of handlers) handler(message);
    },
    subscribe(target: TwinMessagePortRef, handler: PatchMessageHandler): () => void {
      const key = portKey(target);
      let set = routes.get(key);
      if (!set) {
        set = new Set();
        routes.set(key, set);
      }
      set.add(handler);
      return () => {
        set!.delete(handler);
        if (set!.size === 0) routes.delete(key);
      };
    },
  };
}
