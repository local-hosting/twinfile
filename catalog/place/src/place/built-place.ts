import type { BuildLayerResult } from '../build/twinfile-builder.js';
import type { PlaceWireJson } from '@local-hosting/twinfile-core';
import type { LoadedTwinfile } from '@local-hosting/twinfile-core';

export type PlaceFields = {
  loaded: LoadedTwinfile;
  /** Merged collections (`spaces`, `events`, `situationBindings`, …). */
  data: Record<string, unknown>;
  meta: Record<string, unknown>;
  digest: string;
  layers: BuildLayerResult[];
  refKey: string;
  manifestDigest: string;
  treeDigest: string;
};

/**
 * Content-addressed place built from a {@link Twinfile} unit (`twin build`).
 * Composition stays on {@link Twinfile}; this type is the merge product only.
 */
export class Place {
  readonly loaded: LoadedTwinfile;
  readonly data: Record<string, unknown>;
  readonly meta: Record<string, unknown>;
  readonly digest: string;
  readonly layers: BuildLayerResult[];
  readonly refKey: string;
  readonly manifestDigest: string;
  readonly treeDigest: string;

  constructor(fields: PlaceFields) {
    this.loaded = fields.loaded;
    this.data = fields.data;
    this.meta = fields.meta;
    this.digest = fields.digest;
    this.layers = fields.layers;
    this.refKey = fields.refKey;
    this.manifestDigest = fields.manifestDigest;
    this.treeDigest = fields.treeDigest;
  }

  get events(): unknown[] | undefined {
    const row = this.data.events;
    return Array.isArray(row) ? row : undefined;
  }

  /** JSON Schema wire shape for MCP `twin://place` (root) and OCI config blob. */
  toWire(): PlaceWireJson {
    return { meta: this.meta, place: this.data, digest: this.digest };
  }
}
