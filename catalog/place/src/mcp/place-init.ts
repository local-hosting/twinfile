import { createPlace } from '../cli/init-place-from-geotype.js';
import { suggestedLayerHints } from '@doppler-group/twinfile-core';

/** Scaffold a place without opening the served unit. `dir` defaults to that unit. */
export function createPlaceFromMcp(
  params: Record<string, unknown> | undefined,
  fallbackDir: string,
): Record<string, unknown> {
  const geotype = typeof params?.geotype === 'string' ? params.geotype.trim() : '';
  if (!geotype) return { error: 'geotype is required', digest: null };

  const dir = typeof params?.dir === 'string' && params.dir.trim() ? params.dir : fallbackDir;
  const name = typeof params?.name === 'string' ? params.name : undefined;

  try {
    const created = createPlace(dir, {
      geotype,
      unitName: name,
      useFrom: params?.from !== false,
      decorate: params?.decorate !== false,
    });
    return {
      ok: true,
      digest: null,
      dir: created.dir,
      name: created.unitName,
      geotype: created.geotype,
      mixins: created.mixins,
      bindings: created.bindings,
      suggestedLayers: created.suggestedLayers,
      layerHints: suggestedLayerHints(created.suggestedLayers),
      ...(created.decorateNote ? { decorateNote: created.decorateNote } : {}),
    };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error), digest: null };
  }
}
