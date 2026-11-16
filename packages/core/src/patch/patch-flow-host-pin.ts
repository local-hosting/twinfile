import { sha256Digest } from '../build/digest.js';
import { canonicalizeJson } from '../build/merge.js';
import { parseModuleGraphFromTwinfile } from './module-graph-twinfile.js';

/** Proposed host collection for saved patch flows ([host.md](../../../spec/doc/pack/adapters/host.md)). */
export const PATCH_FLOW_COLLECTION_ID = 'items.patch.flow.v1' as const;

export type PatchFlowHostPin = {
  collection: typeof PATCH_FLOW_COLLECTION_ID;
  imageDigest: string;
  wiringDigest: string;
};

/** Pins a manifest wiring graph beside a built `Place` digest (host CRUD uses both keys). */
export function pinPatchFlow(imageDigest: string, twinfile: Record<string, unknown>): PatchFlowHostPin | undefined {
  const graph = parseModuleGraphFromTwinfile(twinfile);
  if (!graph) return undefined;
  const wiringDigest = sha256Digest(canonicalizeJson(graph));
  return {
    collection: PATCH_FLOW_COLLECTION_ID,
    imageDigest,
    wiringDigest,
  };
}
