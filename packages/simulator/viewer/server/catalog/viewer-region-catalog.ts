import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { parse } from 'yaml';

import type { ViewerCatalogEntry } from './viewer-catalog.js';
import {
  regionNavFromTwinfile,
  type RegionNavRow,
} from '@doppler-group/twinfile-place';

function readManifest(unitDir: string): Record<string, unknown> | undefined {
  const manifestFile = ['Twinfile.yaml', 'twinfile.yaml']
    .map((name) => join(unitDir, name))
    .find((p) => {
      try {
        return statSync(p).isFile();
      } catch {
        return false;
      }
    });
  if (!manifestFile) return undefined;
  try {
    const doc = parse(readFileSync(manifestFile, 'utf8'));
    return doc && typeof doc === 'object' && !Array.isArray(doc) ? (doc as Record<string, unknown>) : undefined;
  } catch {
    return undefined;
  }
}

function regionUnitId(parentId: string, spaceId: string): string {
  return `${parentId}/regions/${spaceId}`;
}

function regionParentId(unit: ViewerCatalogEntry, row: RegionNavRow, navIds: Set<string>): string {
  if (row.parent && navIds.has(row.parent)) return regionUnitId(unit.id, row.parent);
  return unit.id;
}

/** Virtual sidebar rows for manifest `spaces:` (off while {@link VIEWER_INLINE_SUBPLACES_ONLY}). */
export function listViewerRegionCatalog(units: ViewerCatalogEntry[]): ViewerCatalogEntry[] {
  const out: ViewerCatalogEntry[] = [];
  for (const unit of units) {
    if (unit.kind !== 'place') continue;
    const head = readManifest(unit.path);
    if (!head) continue;
    const rows = regionNavFromTwinfile(head);
    if (!rows.length) continue;
    const navIds = new Set(rows.map((r) => r.id));
    for (const row of rows) {
      out.push({
        id: regionUnitId(unit.id, row.id),
        label: row.name ?? row.id,
        group: unit.group,
        kind: 'region',
        path: unit.path,
        parent: regionParentId(unit, row, navIds),
        region: row.id,
      });
    }
  }
  return out;
}
