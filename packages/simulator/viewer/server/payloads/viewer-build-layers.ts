import {
  type BuildTwinfileResult,
} from '@local-hosting/twinfile-place';
import {
  buildLayerDisplayLabel,
  listTwinfileManifestRecipe,
  summarizeBuildLayerRows,
} from '@local-hosting/twinfile-core';

import type { ViewerBuildHistoryPayload, ViewerBuildLayerRow } from '../../types/workbench-api.js';

function toViewerRows(result: BuildTwinfileResult): ViewerBuildLayerRow[] {
  return result.layers.map((layer, index) => ({
    index,
    ref: layer.ref,
    kind: layer.kind,
    chain: layer.chain,
  }));
}

/** Manifest recipe + summarized image layer chain for the workbench. */
export function buildViewerBuildHistory(result: BuildTwinfileResult): ViewerBuildHistoryPayload {
  const detailLayers = toViewerRows(result);
  const layers = summarizeBuildLayerRows(detailLayers);
  const recipe = listTwinfileManifestRecipe(result.loaded.twinfile);
  return { recipe, layers, detailLayers };
}

/** Back-compat: summarized rows only. */
export function listViewerBuildLayers(result: BuildTwinfileResult): ViewerBuildLayerRow[] {
  return buildViewerBuildHistory(result).layers;
}

export { buildLayerDisplayLabel };
