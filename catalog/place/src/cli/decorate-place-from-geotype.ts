import { join } from 'node:path';

import { placeDecorationsForSlug, type PlaceLayerKind } from '@doppler-group/geotypes';

import { loadTwinfile } from '@doppler-group/twinfile-core';
import { twinHeadPath } from '@doppler-group/twinfile-core';
import { listPlaceSituationBindings, mergePlaceFromTwinfile } from '../place/place-inherit.js';
import { placeMixinRef } from '@doppler-group/twinfile-core';
import type { Result } from '@doppler-group/twinfile-core';
import { addLeadingCopies, readTwinfileDoc, writeTwinfileDoc } from '@doppler-group/twinfile-core/cli';

export type DecoratePlaceResult = {
  mixins: string[];
  bindings: string[];
  suggestedLayers: PlaceLayerKind[];
  /** Situation ids from geotypes — wire with `bind:` + simulator catalog, not golden mixin copies. */
  situationHints?: string[];
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
  options: { examplesRoot: string; simulatorRoot?: string },
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
  const inherit = { examplesRoot: options.examplesRoot, simulatorRoot: options.simulatorRoot };
  const place = unwrap(mergePlaceFromTwinfile(unit, inherit));
  return {
    mixins: mixinRefs,
    bindings: unwrap(listPlaceSituationBindings(unit, inherit)).map((row) => row.rel),
    suggestedLayers: decorations.layers.filter((kind) => !place[kind]?.length),
    situationHints: [...decorations.situations],
  };
}
