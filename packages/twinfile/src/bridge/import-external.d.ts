import type { ImportResult } from './types.js';
/** Legacy ids for synchronous conformance (excludes `ifc`). */
export type ExternalSource = 'imdf' | 'gtfs' | 'brick' | 'bot' | 'sosa' | 'gltf';
export type GtfsInput = {
    stops: string;
    shapes: string;
    pathways?: string;
};
export { twinId } from './place-kit.js';
export declare function importExternal(source: ExternalSource, input: unknown): ImportResult;
export declare function writeImportedFiles(dir: string, files: Record<string, string>): void;
