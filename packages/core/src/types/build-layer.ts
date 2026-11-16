import type { LayerMergeMode } from '../load/twinfile-paths.js';

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
