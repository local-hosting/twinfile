import type { PatchGraphV1 } from './patch-graph.js';
import type { PatchUiModel } from './processor-ui.js';

/** Schema id for MCP / HTTP bodies that ship graph + UI projection together. */
export const TWINFILE_PROCESSORS_RESOURCE_SCHEMA = 'twinfile.processors.resource.v1' as const;

export type ProcessorsResourceV1 = {
  schema: typeof TWINFILE_PROCESSORS_RESOURCE_SCHEMA;
  digest?: string;
  graph: PatchGraphV1;
  ui: PatchUiModel;
  catalogRef: 'conf/patch-module-types.yaml';
};
