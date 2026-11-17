import { loadGeneralCustomerTaxonomy } from '../load-general-customer-taxonomy.js';

/** Base customer taxonomy loaded from YAML — focus areas merged in getDefaultCustomerCatalog(). */
export const DEFAULT_CUSTOMER_CATALOG = loadGeneralCustomerTaxonomy();
