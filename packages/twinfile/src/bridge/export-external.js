import { resolveBridgeRef } from './resolve-bridge.js';
export function exportExternal(source, bundlePlace, feed) {
    const bridge = resolveBridgeRef(source);
    if (!bridge.exportPlace)
        throw new Error(`bridge ${source} does not support export`);
    return bridge.exportPlace(bundlePlace, feed);
}
