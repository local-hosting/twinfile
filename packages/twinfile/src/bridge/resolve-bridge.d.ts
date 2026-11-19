import type { TwinBridge } from './types.js';
/** Built-in id → primary npm package (built-ins ship in `@local-hosting/twinfile/bridge`). */
export declare const BRIDGE_PACKAGES: Record<string, string>;
/** Parse `npm:@scope/pkg@^1` → package name for resolve. */
export declare function npmPackageName(ref: string): string;
export declare function isRegisteredBridgeId(id: string): boolean;
export declare function listRegisteredBridgeIds(): string[];
export declare function resolveBridgeRef(ref: string): TwinBridge;
export declare function loadBridgeFromNpm(ref: string): Promise<TwinBridge>;
export declare function resolveBridge(ref: string): Promise<TwinBridge>;
