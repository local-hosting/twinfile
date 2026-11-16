import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { resolveBridgeRef } from './resolve-bridge.js';
import type { ImportResult } from './types.js';

/** Legacy ids for synchronous conformance (excludes `ifc`). */
export type ExternalSource = 'imdf' | 'gtfs' | 'brick' | 'bot' | 'sosa' | 'gltf';

export type GtfsInput = { stops: string; shapes: string; pathways?: string };

export { twinId } from './place-kit.js';

export function importExternal(source: ExternalSource, input: unknown): ImportResult {
  const bridge = resolveBridgeRef(source);
  if (!bridge.importPlace) throw new Error(`bridge ${source} does not support import`);
  const out = bridge.importPlace(input);
  if (out instanceof Promise) {
    throw new Error(`bridge ${source}: async importPlace is not supported in importExternal`);
  }
  return out;
}

export function writeImportedFiles(dir: string, files: Record<string, string>): void {
  for (const [rel, body] of Object.entries(files)) {
    const path = join(dir, rel);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, body.endsWith('\n') ? body : `${body}\n`);
  }
}
