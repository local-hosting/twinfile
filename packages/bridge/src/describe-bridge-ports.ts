import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

import yaml from 'yaml';

import type { PatchPortDef } from './bridge-port-types.js';

const require = createRequire(import.meta.url);

type BridgePortsCatalog = Record<string, { ports: Record<string, PatchPortDef> }>;

let cached: BridgePortsCatalog | undefined;

function loadCatalog(): BridgePortsCatalog {
  if (cached) return cached;
  const specRoot = dirname(require.resolve('@doppler-group/twinfile-spec/package.json'));
  const raw = readFileSync(join(specRoot, 'conf', 'bridge-module-ports.yaml'), 'utf8');
  const doc = yaml.parse(raw) as { bridges?: BridgePortsCatalog };
  cached = doc.bridges ?? {};
  return cached;
}

/** Port metadata for a built-in bridge id (`gtfs`, `imdf`, …). */
export function describeBridgePorts(bridgeId: string): Record<string, PatchPortDef> | undefined {
  return loadCatalog()[bridgeId]?.ports;
}

export function listBridgePortCatalogIds(): string[] {
  return Object.keys(loadCatalog()).sort();
}
