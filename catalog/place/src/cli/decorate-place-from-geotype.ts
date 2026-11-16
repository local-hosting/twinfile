import { placeDecorationsForSlug, type PlaceLayerKind } from '@local-hosting/geotypes';

import { loadTwinfile } from '@local-hosting/twinfile-core';
import { twinHeadPath } from '@local-hosting/twinfile-core';
import { listPlaceEventBindings, mergePlaceFromTwinfile } from '../place/place-inherit.js';
import type { Result } from '@local-hosting/twinfile-core';
import {
  isStarterLayerKind,
  readTwinfileDoc,
  starterLayerStep,
  upsertStepItem,
  writeTwinfileDoc,
  type StarterLayerKind,
} from '@local-hosting/twinfile-core/cli';

export type DecoratePlaceResult = {
  /** Layers seeded with starter rows (`assets`, `sensors`). */
  starterLayers: StarterLayerKind[];
  bindings: string[];
  suggestedLayers: PlaceLayerKind[];
  /** Event ids from geotypes — wire with `bind:` + the event catalog. */
  eventHints?: string[];
};

function unwrap<T>(result: Result<T>): T {
  if (!result.ok) throw new Error(result.errors.map((e) => e.message).join('; '));
  return result.value;
}

/** Apply geotype decorators: add starter `assets` / `sensors` rows as steps when the geotype suggests them. */
export function decoratePlaceFromGeotype(
  unitDir: string,
  slug: string,
  options: { examplesRoot: string },
): DecoratePlaceResult {
  const decorations = placeDecorationsForSlug(slug);
  if (!decorations) throw new Error(`No decorations for geotype "${slug}"`);

  const starterLayers = decorations.layers.filter(isStarterLayerKind);
  const twinfilePath = twinHeadPath(unitDir);
  const twinfile = readTwinfileDoc(twinfilePath);
  for (const kind of starterLayers) {
    upsertStepItem(twinfile, starterLayerStep(kind), (step) => kind in step, false);
  }
  writeTwinfileDoc(twinfilePath, twinfile);

  const unit = unwrap(loadTwinfile(unitDir));
  const inherit = { examplesRoot: options.examplesRoot };
  const place = unwrap(mergePlaceFromTwinfile(unit, inherit));
  return {
    starterLayers,
    bindings: unwrap(listPlaceEventBindings(unit, inherit)).map((row) => row.rel),
    suggestedLayers: decorations.layers.filter((kind) => !place[kind]?.length),
    eventHints: [...decorations.events],
  };
}
