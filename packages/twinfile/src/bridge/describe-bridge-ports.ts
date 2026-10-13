import { readFileSync } from 'node:fs';

import yaml from 'yaml';

import type { PatchPortDef } from './bridge-port-types.js';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

type BridgePortsCatalog = Record<string, { ports: Record<string, PatchPortDef> }>;

let cached: BridgePortsCatalog | undefined;

function loadCatalog(): BridgePortsCatalog {
  if (cached) return cached;
  const specRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'spec');
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
