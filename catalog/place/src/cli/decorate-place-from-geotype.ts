import { join } from 'node:path';

import { placeDecorationsForSlug, type PlaceLayerKind } from '@doppler-group/geotypes';

import { loadTwinfile } from '@doppler-group/twinfile-core';
import { twinHeadPath } from '@doppler-group/twinfile-core';
import { listPlaceEventBindings, mergePlaceFromTwinfile } from '../place/place-inherit.js';
import { placeMixinRef } from '@doppler-group/twinfile-core';
import type { Result } from '@doppler-group/twinfile-core';
import { addLeadingCopies, readTwinfileDoc, writeTwinfileDoc } from '@doppler-group/twinfile-core/cli';

export type DecoratePlaceResult = {
  mixins: string[];
  bindings: string[];
  suggestedLayers: PlaceLayerKind[];
  /** Event ids from geotypes — wire with `bind:` + simulator catalog, not golden mixin copies. */
  eventHints?: string[];
};

/** Decoration layers that ship as golden mixins; other suggested layers are site-specific. */
const MIXIN_LAYER_KINDS: readonly PlaceLayerKind[] = ['assets', 'sensors'];

function unwrap<T>(result: Result<T>): T {
  if (!result.ok) throw new Error(result.errors.map((e) => e.message).join('; '));
  return result.value;
}

/** Apply geotype decorators: `copy:` golden assets/sensors mixin kits from examples. */
export function decoratePlaceFromGeotype(
  unitDir: string,
  slug: string,
  options: { examplesRoot: string },
): DecoratePlaceResult {
  const decorations = placeDecorationsForSlug(slug);
  if (!decorations) throw new Error(`No decorations for geotype "${slug}"`);

  const kits = decorations.layers.filter((kind) => MIXIN_LAYER_KINDS.includes(kind));
  const mixinRefs = kits.map((kind) => placeMixinRef(kind));
  const twinfilePath = twinHeadPath(unitDir);
  const twinfile = readTwinfileDoc(twinfilePath);
  addLeadingCopies(twinfile, mixinRefs);
  writeTwinfileDoc(twinfilePath, twinfile);

  const unit = unwrap(loadTwinfile(unitDir));
  const inherit = { examplesRoot: options.examplesRoot };
  const place = unwrap(mergePlaceFromTwinfile(unit, inherit));
  return {
    mixins: mixinRefs,
    bindings: unwrap(listPlaceEventBindings(unit, inherit)).map((row) => row.rel),
    suggestedLayers: decorations.layers.filter((kind) => !place[kind]?.length),
    eventHints: [...decorations.situations],
  };
}
