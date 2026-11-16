import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { resolveCharacterCatalogsRoot } from '../../catalog/resolve-package-root.js';
import type { ArchetypePresetId } from './archetype-preset.schema.js';
import {
  extensionFocusAreasFromSource,
  mergeFocusAreaCatalogs,
  normalizeFocusAreaCatalogSource,
} from './focus-area.js';
import type { FocusAreaCatalog } from './focus-area.schema.js';
import { FocusAreaCatalogSchema } from './focus-area.schema.js';

export const GENERAL_FOCUS_AREAS_CATALOG_PATH = 'audience/general-focus-areas.yaml';

let cachedSource: unknown;
let cachedUniversalCatalog: FocusAreaCatalog | undefined;

function readFocusAreaCatalogSource(): unknown {
  cachedSource ??= parseYaml(
    readFileSync(
      join(resolveCharacterCatalogsRoot(import.meta.url), GENERAL_FOCUS_AREAS_CATALOG_PATH),
      'utf8',
    ),
  );
  return cachedSource;
}

export interface LoadGeneralFocusAreaCatalogOptions {
  methodId?: string;
  archetypePresetId?: ArchetypePresetId;
}

/** Load the library-owned general focus area catalog from tier-grouped YAML. */
export function loadGeneralFocusAreaCatalog(
  options: LoadGeneralFocusAreaCatalogOptions = {},
): FocusAreaCatalog {
  const source = readFocusAreaCatalogSource();
  cachedUniversalCatalog ??= normalizeFocusAreaCatalogSource(source);

  let catalog = cachedUniversalCatalog;
  if (options.archetypePresetId) {
    const extensionRows = extensionFocusAreasFromSource(source, options.archetypePresetId);
    if (extensionRows.length > 0) {
      catalog = mergeFocusAreaCatalogs(
        catalog,
        FocusAreaCatalogSchema.parse({
          specVersion: catalog.specVersion,
          methodId: catalog.methodId,
          focusAreas: extensionRows,
        }),
      );
    }
  }

  if (options.methodId && catalog.methodId !== options.methodId) {
    return FocusAreaCatalogSchema.parse({ ...catalog, methodId: options.methodId });
  }

  return catalog;
}
