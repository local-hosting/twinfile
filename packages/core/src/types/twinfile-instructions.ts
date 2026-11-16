import type { LayerMergeMode } from '../load/twinfile-paths.js';

/** Merge one place collection document on top of the image built so far (one layer). */
export type TwinfilePatchInstruction = {
  type: 'patch';
  ref: string;
  doc: Record<string, unknown>;
  mergeMode: LayerMergeMode;
};

/** Pull another unit's built content in at this position (`COPY --from`). */
export type TwinfileCopyInstruction = {
  type: 'copy';
  ref: string;
  copy: string;
  /** Site space id the copied rows hang under; defaults the id prefix to `<into>-`. */
  into?: string;
  prefix?: string;
};

/** One authored step of a unit, in build order (RFC 0009). */
export type TwinfileInstruction = TwinfilePatchInstruction | TwinfileCopyInstruction;

/** Situation binding document: `bindings/*.yaml` or a `steps[]` `bind:` item. */
export type SituationBindingDoc = {
  rel: string;
  doc: Record<string, unknown>;
};

