import { join } from 'node:path';
import { loadYamlCatalog } from '../../catalog/load-yaml-catalog.js';
import { resolveCharacterCatalogsRoot } from '../../catalog/resolve-package-root.js';
import {
  CustomerCatalogSchema,
  type CustomerCatalog,
} from '../customer/profile/customer.js';

export const GENERAL_CUSTOMER_TAXONOMY_CATALOG_PATH =
  'audience/general-customer-taxonomy.yaml';

const BaseCustomerCatalogSchema = CustomerCatalogSchema.omit({
  focusAreas: true,
  psychographicSegments: true,
  painPoints: true,
});

let cachedCatalog: CustomerCatalog | undefined;

/** Load the library-owned customer taxonomy (without focus areas or pain points). */
export function loadGeneralCustomerTaxonomy(): CustomerCatalog {
  cachedCatalog ??= CustomerCatalogSchema.parse({
    ...loadYamlCatalog(
      join(resolveCharacterCatalogsRoot(import.meta.url), GENERAL_CUSTOMER_TAXONOMY_CATALOG_PATH),
      BaseCustomerCatalogSchema,
    ),
    psychographicSegments: [],
    focusAreas: [],
    painPoints: [],
  });

  return cachedCatalog;
}
