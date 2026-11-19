import type { PlaceLayerKind } from '@local-hosting/geotypes';

export const VISITS_LAYER_HINT =
  'visits: optional visit moments (layout TOC; runtime movement is host-owned)';

/** Extra lines to print after `twin init place` layer suggestions. */
export function suggestedLayerHints(layers: readonly PlaceLayerKind[]): string[] {
  return layers.includes('visits') ? [VISITS_LAYER_HINT] : [];
}
