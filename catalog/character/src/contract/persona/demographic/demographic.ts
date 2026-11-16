import { DemographicCatalogSchema, type DemographicCatalog } from './demographic.schema.js';

export function parseDemographicCatalog(input: unknown): DemographicCatalog {
  return DemographicCatalogSchema.parse(input);
}
