import { readFileSync } from 'node:fs';

import yaml from 'yaml';

import { isPatchModuleTypeId, isPatchWire } from '../generated/patch-module-types-data.js';
import { resolveSpecConfPath } from '../paths/resolve-spec-conf.js';
import type { PatchModuleTypeCatalog } from '../types/patch-graph.js';

/** Open patch module port catalog from `@local-hosting/twinfile` conf (Node hosts). */
export function loadPatchModuleTypeCatalog(): PatchModuleTypeCatalog {
  const raw = readFileSync(resolveSpecConfPath('patch-module-types.yaml'), 'utf8');
  const doc = yaml.parse(raw) as { module_types?: PatchModuleTypeCatalog };
  const catalog = doc.module_types ?? {};
  for (const [typeId, def] of Object.entries(catalog)) {
    if (!isPatchModuleTypeId(typeId)) {
      throw new Error(`patch module catalog drift: unknown type "${typeId}" (run scripts/sync-patch-module-types.mjs)`);
    }
    for (const [portName, port] of Object.entries(def.ports ?? {})) {
      if (!isPatchWire(port.wire)) {
        throw new Error(
          `patch module catalog drift: ${typeId}.${portName} wire "${port.wire}" (run scripts/sync-patch-module-types.mjs)`,
        );
      }
    }
  }
  return catalog;
}
