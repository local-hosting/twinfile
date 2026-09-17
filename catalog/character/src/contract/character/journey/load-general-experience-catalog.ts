import { join } from 'node:path';
import { loadYamlCatalog } from '../catalog/load-yaml-catalog.js';
import { resolveCharacterCatalogsRoot } from '../catalog/resolve-package-root.js';
import {
  ExperienceTypeCatalogSchema,
  type ExperienceTypeCatalog,
} from './experience-type.schema.js';

export const GENERAL_EXPERIENCE_ROOTS_CATALOG_PATH =
  'journey/general-experience-roots.yaml';

let cachedCatalog: ExperienceTypeCatalog | undefined;

/** Load the library-owned general experience type root catalog from YAML. */
export function loadGeneralExperienceRootCatalog(
  methodId?: string,
): ExperienceTypeCatalog {
  cachedCatalog ??= loadYamlCatalog(
    join(
      resolveCharacterCatalogsRoot(import.meta.url),
      GENERAL_EXPERIENCE_ROOTS_CATALOG_PATH,
    ),
    ExperienceTypeCatalogSchema,
  );

  const catalog = cachedCatalog;
  if (methodId && catalog.methodId !== methodId) {
    return ExperienceTypeCatalogSchema.parse({ ...catalog, methodId });
  }

  return catalog;
}
