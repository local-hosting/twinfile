import { loadUnitRoot, unitAddress, type BuildTwinfileSummaryInput } from '@local-hosting/twinfile-core';

import type { BuildTwinfileResult } from '../build/build-twinfile.js';
import { eventBindingsFromBuilt } from '../place/event-bindings.js';

export function summaryInputFromBuild(result: BuildTwinfileResult): BuildTwinfileSummaryInput {
  const loaded = loadUnitRoot(unitAddress(result.loaded));
  const mergedPlace = result.data;
  const meta = result.meta;
  return {
    twinfile: loaded.ok ? loaded.value.twinfile : result.loaded.twinfile,
    unitPath: result.loaded.twinfilePath,
    digest: result.digest,
    place: mergedPlace,
    placeType: meta?.placeType,
    eventBindings: eventBindingsFromBuilt(mergedPlace),
    events: (result.events ?? []) as Record<string, unknown>[],
    resolvedArgs: (meta?.resolvedArgs ?? undefined) as Record<string, unknown> | undefined,
  };
}
