import { resolveBridgeRef } from './resolve-bridge.js';
import type { TwinBridge } from './types.js';

/** Default npm entry re-exports the IMDF bridge (lazy to avoid load-order cycles). */
let cached: TwinBridge | undefined;

export function defaultBridge(): TwinBridge {
  if (!cached) cached = resolveBridgeRef('imdf');
  return cached;
}
