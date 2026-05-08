import type { RefResolver } from '../ref/ref-resolver.js';
import type { TwinfileRef } from './twinfile-ref.js';

/** On-disk example place unit resolved from a `twinfile/name:version` ref (local dev / examples root). */
export type ResolvedExamplePlace = {
  ref: TwinfileRef;
  rootDir: string;
  twinfile: Record<string, unknown>;
  layers: Record<string, unknown>[];
};

export type ResolveExamplePlaceOptions = {
  /** Flat place catalog root (defaults to {@link defaultExamplesRoot}). */
  examplesRoot?: string;
  resolver?: RefResolver;
};
