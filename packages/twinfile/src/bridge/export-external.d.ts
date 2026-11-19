import type { ExternalSource } from './import-external.js';
import type { FeedRow } from './types.js';
type Row = Record<string, unknown>;
export declare function exportExternal(source: ExternalSource, bundlePlace: Row, feed?: FeedRow): Record<string, string>;
export {};
