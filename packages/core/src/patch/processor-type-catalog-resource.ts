import { loadPatchModuleTypeCatalog } from './module-type-catalog.js';
import type { PatchModuleTypeCatalog } from '../types/patch-graph.js';

export const TWINFILE_PROCESSOR_TYPES_RESOURCE_SCHEMA = 'twinfile.processor-types.v1' as const;

export type ProcessorTypeCatalogResourceV1 = {
  schema: typeof TWINFILE_PROCESSOR_TYPES_RESOURCE_SCHEMA;
  catalogRef: 'conf/patch-module-types.yaml';
  moduleTypes: PatchModuleTypeCatalog;
};

export function buildProcessorTypeCatalogResource(): ProcessorTypeCatalogResourceV1 {
  return {
    schema: TWINFILE_PROCESSOR_TYPES_RESOURCE_SCHEMA,
    catalogRef: 'conf/patch-module-types.yaml',
    moduleTypes: loadPatchModuleTypeCatalog(),
  };
}
