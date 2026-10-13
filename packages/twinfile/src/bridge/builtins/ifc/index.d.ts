import type { ImportResult, TwinBridge } from '../../types.js';
export declare function importPlace(input: unknown): ImportResult;
/** CLI / async path for STEP `.ifc` files. */
export declare function importIfc(input: unknown): Promise<ImportResult>;
export declare const bridge: TwinBridge;
export { importIfcProjection } from './import-ifc-projection.js';
export { importIfcStep, isIfcBytesInput, type IfcBytesInput } from './import-ifc-step.js';
