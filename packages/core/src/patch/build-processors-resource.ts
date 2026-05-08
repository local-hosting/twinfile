import {
  TWINFILE_PROCESSORS_RESOURCE_SCHEMA,
  type ProcessorsResourceV1,
} from '../types/processors-resource.js';
import type { PatchGraphV1, PatchModuleTypeCatalog } from '../types/patch-graph.js';

import { parseModuleGraphFromTwinfile } from './module-graph-twinfile.js';
import { loadPatchModuleTypeCatalog } from './module-type-catalog.js';
import { projectPatchGraphForUi } from './project-patch-ui.js';

export type BuildProcessorsResourceOptions = {
  digest?: string;
  catalog?: PatchModuleTypeCatalog;
};

export function buildProcessorsResourceFromGraph(
  graph: PatchGraphV1,
  options: BuildProcessorsResourceOptions = {},
): ProcessorsResourceV1 {
  const catalog = options.catalog ?? loadPatchModuleTypeCatalog();
  return {
    schema: TWINFILE_PROCESSORS_RESOURCE_SCHEMA,
    ...(options.digest ? { digest: options.digest } : {}),
    graph,
    ui: projectPatchGraphForUi(graph, catalog),
    catalogRef: 'conf/patch-module-types.yaml',
  };
}

/**
 * Framework-neutral payload for patch canvas hosts: resolved graph + `PatchUiModel`.
 * Use from Vue, React, or any runtime that can consume JSON (or call this in Node).
 */
export function buildProcessorsResourceFromTwinfile(
  twinfile: Record<string, unknown>,
  options: BuildProcessorsResourceOptions = {},
): ProcessorsResourceV1 | undefined {
  const graph = parseModuleGraphFromTwinfile(twinfile);
  if (!graph) return undefined;
  return buildProcessorsResourceFromGraph(graph, options);
}
