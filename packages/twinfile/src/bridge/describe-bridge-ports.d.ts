import type { PatchPortDef } from './bridge-port-types.js';
/** Port metadata for a built-in bridge id (`gtfs`, `imdf`, …). */
export declare function describeBridgePorts(bridgeId: string): Record<string, PatchPortDef> | undefined;
export declare function listBridgePortCatalogIds(): string[];
