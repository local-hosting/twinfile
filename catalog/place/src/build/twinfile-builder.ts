import { ContractChecker, type ContractError, type ExpectsRole, type PlanRoles } from '@doppler-group/twinfile-core';
import { LayerCache } from '@doppler-group/twinfile-core';
import { layerChainDigest, placeImageDigest, sha256Digest } from '@doppler-group/twinfile-core';
import { mergeObjects, type MergeOptions, type LayerMergeMode } from '@doppler-group/twinfile-core';

export type BuildLayerKind = 'place' | 'mixin' | 'copy' | 'patch' | 'binding' | 'args';

export type ComposedBuildLayer = {
  ref: string;
  kind: BuildLayerKind;
  patch: unknown;
  mergeMode?: LayerMergeMode;
};

export type BuildLayerResult = {
  ref: string;
  kind: string;
  content: string;
  chain: string;
};

export type TwinfileBuilderResult = {
  place: Record<string, unknown>;
  layers: BuildLayerResult[];
  digest: string;
  metaExtras: Record<string, unknown>;
  errors: ContractError[];
};

export type ContractPass = {
  unitName: string;
  expects: Record<string, ExpectsRole>;
  planRoles: PlanRoles;
};

export type TwinfileBuilderInput = {
  layers: ComposedBuildLayer[];
  contracts?: ContractPass[];
  meta?: Record<string, unknown>;
  layerCache?: LayerCache;
};

/** Content-addressed `Place` build (merge, contract, digests). */
export class TwinfileBuilder {
  readonly #contract = new ContractChecker();

  build(input: TwinfileBuilderInput): TwinfileBuilderResult {
    let place: Record<string, unknown> = {};
    const layerResults: BuildLayerResult[] = [];
    let parent: string | null = null;
    const metaExtras: Record<string, unknown> = {};
    const cache = input.layerCache;

    for (let i = 0; i < input.layers.length; i += 1) {
      const layer = input.layers[i]!;
      const content = sha256Digest(layer.patch);
      const chain = layerChainDigest({
        parent,
        content,
        kind: layer.kind,
        ref: layer.ref,
      });

      const cached = cache?.get(chain);
      if (cached) {
        place = cached.place;
        layerResults.push({ ref: layer.ref, kind: layer.kind, content, chain });
        parent = chain;
        if (layer.kind === 'args' && layer.patch && typeof layer.patch === 'object') {
          metaExtras.resolvedArgs = layer.patch;
        }
        continue;
      }

      layerResults.push({ ref: layer.ref, kind: layer.kind, content, chain });
      parent = chain;

      if (
        layer.kind === 'place' ||
        layer.kind === 'mixin' ||
        layer.kind === 'copy' ||
        layer.kind === 'patch'
      ) {
        const mergeOpts: MergeOptions = layer.mergeMode ? { mode: layer.mergeMode } : {};
        place = mergeObjects(place, layer.patch, mergeOpts) as Record<string, unknown>;
      } else if (layer.kind === 'args' && layer.patch && typeof layer.patch === 'object') {
        metaExtras.resolvedArgs = layer.patch;
      }
      cache?.set(chain, place);
    }

    const errors: ContractError[] = [];
    for (const pass of input.contracts ?? []) {
      const missingPlan = this.#contract.checkPlanPresent(pass.planRoles, pass.unitName);
      if (missingPlan) errors.push(missingPlan);
      errors.push(
        ...this.#contract.checkExpects(
          place as Record<string, { id: string }[]>,
          pass.expects,
          pass.planRoles,
        ),
      );
    }

    const meta = { ...input.meta, ...metaExtras };
    const digest = placeImageDigest({
      meta,
      place,
      layers: layerResults.map((l) => l.chain),
    });

    return { place, layers: layerResults, digest, metaExtras, errors };
  }

  verify(result: TwinfileBuilderResult, expectedDigest: string): boolean {
    return result.digest === expectedDigest && result.errors.length === 0;
  }
}
