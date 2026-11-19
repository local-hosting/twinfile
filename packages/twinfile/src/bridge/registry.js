import { resolveBridgeRef } from './resolve-bridge.js';
/** Default npm entry re-exports the IMDF bridge (lazy to avoid load-order cycles). */
let cached;
export function defaultBridge() {
    if (!cached)
        cached = resolveBridgeRef('imdf');
    return cached;
}
