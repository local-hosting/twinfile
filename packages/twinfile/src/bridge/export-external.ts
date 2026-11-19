import { resolveBridgeRef } from './resolve-bridge.js';
import type { ExternalSource } from './import-external.js';
import type { FeedRow } from './types.js';

type Row = Record<string, unknown>;

export function exportExternal(source: ExternalSource, bundlePlace: Row, feed?: FeedRow): Record<string, string> {
  const bridge = resolveBridgeRef(source);
  if (!bridge.exportPlace) throw new Error(`bridge ${source} does not support export`);
  return bridge.exportPlace(bundlePlace, feed);
}
