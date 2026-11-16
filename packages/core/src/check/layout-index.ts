import { statSync } from 'node:fs';
import { join } from 'node:path';

import type { LoadedTwinfile } from '../load/load-twinfile.js';
import { twinfileLayerPaths } from '../load/twinfile-paths.js';
import { isPatchesTwinfile, listTwinfilePatchDocs } from '../load/twinfile-instructions.js';
import type { Result, TwinError } from '../types/twin-error.js';
import { err, ok } from '../types/twin-error.js';
import {
  readYamlDocument,
  validateDocumentAtPath,
} from '../validate/validate-yaml.js';

export const LAYOUT_INDEX_REL = 'ext/layout-index.yaml';
export const LAYOUT_INDEX_SCHEMA_ID = 'https://twinfile.org/schemas/1/ext/layout-index.schema.json';

export type LayoutIndexRegion = {
  id: string;
  title?: string;
  granularity?: string;
  space_ids?: string[];
  detail_layers?: string[];
  children?: LayoutIndexRegion[];
};

export type LayoutIndexDocument = {
  version?: number;
  regions: LayoutIndexRegion[];
};


function flattenRegions(
  regions: LayoutIndexRegion[],
  seen: Map<string, string>,
  path: string,
  errors: TwinError[],
  file: string,
): void {
  for (const region of regions) {
    const key = region.id;
    if (seen.has(key)) {
      errors.push({
        code: 'E_LAYOUT',
        message: `layout_index duplicate region id "${key}" (also at ${seen.get(key)})`,
        file,
      });
    } else {
      seen.set(key, path ? `${path}/${key}` : key);
    }
    if (region.children?.length) {
      flattenRegions(region.children, seen, path ? `${path}/${key}` : key, errors, file);
    }
  }
}

export function readLayoutIndexDocument(unit: LoadedTwinfile): LayoutIndexDocument | undefined {
  const path = join(unit.root, LAYOUT_INDEX_REL);
  if (!statSync(path, { throwIfNoEntry: false })?.isFile()) return undefined;
  const parsed = readYamlDocument(path);
  const root = parsed.value as Record<string, unknown>;
  const layoutIndex = root.layout_index;
  if (!layoutIndex || typeof layoutIndex !== 'object' || Array.isArray(layoutIndex)) {
    return undefined;
  }
  const doc = layoutIndex as Record<string, unknown>;
  const regions = doc.regions;
  if (!Array.isArray(regions)) return undefined;
  return {
    ...(typeof doc.version === 'number' ? { version: doc.version } : {}),
    regions: regions as LayoutIndexRegion[],
  };
}

export function checkPlaceLayoutIndex(
  unit: LoadedTwinfile,
  spaceIds: Set<string>,
): Result<{ regions: number }> {
  if (unit.twinfile.kind !== 'place') return ok({ regions: 0 });

  const path = join(unit.root, LAYOUT_INDEX_REL);
  if (!statSync(path, { throwIfNoEntry: false })?.isFile()) {
    return ok({ regions: 0 });
  }

  const schemaValid = validateDocumentAtPath(path, LAYOUT_INDEX_SCHEMA_ID);
  if (!schemaValid.ok) return schemaValid;

  const doc = readLayoutIndexDocument(unit);
  if (!doc) {
    return err([
      {
        code: 'E_LAYOUT',
        message: 'layout-index file missing layout_index.regions',
        file: path,
      },
    ]);
  }

  const inline = isPatchesTwinfile(unit.twinfile);
  const manifestLayers = new Set(
    inline ? listTwinfilePatchDocs(unit).flatMap((patch) => Object.keys(patch)) : twinfileLayerPaths(unit.twinfile),
  );
  const errors: TwinError[] = [];
  flattenRegions(doc.regions, new Map(), '', errors, path);

  function walk(regions: LayoutIndexRegion[]): void {
    for (const region of regions) {
      for (const sid of region.space_ids ?? []) {
        if (!spaceIds.has(sid)) {
          errors.push({
            code: 'E_LAYOUT',
            message: `layout_index region "${region.id}" references unknown space "${sid}"`,
            file: path,
          });
        }
      }
      for (const rel of region.detail_layers ?? []) {
        if (!manifestLayers.has(rel)) {
          errors.push({
            code: 'E_LAYOUT',
            message: inline
              ? `layout_index region "${region.id}" detail_layers entry is not a collection in Twinfile.yaml steps: ${rel}`
              : `layout_index region "${region.id}" detail_layers entry not in Twinfile.yaml layers: ${rel}`,
            file: path,
          });
          continue;
        }
        if (inline) continue;
        const layerPath = join(unit.root, rel);
        if (!statSync(layerPath, { throwIfNoEntry: false })?.isFile()) {
          errors.push({
            code: 'E_LAYOUT',
            message: `layout_index detail_layers file missing: ${rel}`,
            file: layerPath,
          });
        }
      }
      if (region.children?.length) walk(region.children);
    }
  }

  walk(doc.regions);

  if (errors.length > 0) return err(errors);
  return ok({ regions: doc.regions.length });
}

export function validateLayoutIndexYamlPath(path: string): Result<LayoutIndexDocument> {
  const valid = validateDocumentAtPath(path, LAYOUT_INDEX_SCHEMA_ID);
  if (!valid.ok) return valid;
  const parsed = readYamlDocument(path);
  const root = parsed.value as Record<string, unknown>;
  const layoutIndex = root.layout_index as Record<string, unknown>;
  return ok({
    ...(typeof layoutIndex.version === 'number' ? { version: layoutIndex.version } : {}),
    regions: layoutIndex.regions as LayoutIndexRegion[],
  });
}
