import { join } from 'node:path';
import { loadYamlCatalog } from '../../catalog/load-yaml-catalog.js';
import { resolveCharacterCatalogsRoot } from '../../catalog/resolve-package-root.js';
import {
  InterestTypeCatalogSchema,
  type InterestTypeCatalog,
} from './interest-type.schema.js';

export const GENERAL_INTEREST_ROOTS_CATALOG_PATH =
  'audience/general-interest-roots.yaml';

let cachedCatalog: InterestTypeCatalog | undefined;

/** Load the library-owned general interest root catalog from YAML. */
export function loadGeneralInterestRootCatalog(
  methodId?: string,
): InterestTypeCatalog {
  cachedCatalog ??= loadYamlCatalog(
    join(resolveCharacterCatalogsRoot(import.meta.url), GENERAL_INTEREST_ROOTS_CATALOG_PATH),
    InterestTypeCatalogSchema,
  );

  const catalog = cachedCatalog;
  if (methodId && catalog.methodId !== methodId) {
    return InterestTypeCatalogSchema.parse({ ...catalog, methodId });
  }

  return catalog;
}

/** @deprecated Use {@link loadGeneralInterestRootCatalog}. */
export const createGeneralInterestRootCatalog = loadGeneralInterestRootCatalog;
