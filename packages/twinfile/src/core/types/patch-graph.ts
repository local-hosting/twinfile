import type { TwinfileUseMode } from './twinfile-spec.js';

export type PatchEndpoint = {
  module: string;
  port: string;
};

export type PatchModule = {
  id: string;
  type: string;
  config?: Record<string, unknown>;
  bind?: Record<string, string>;
};

export type PatchConnection = {
  from: PatchEndpoint;
  to: PatchEndpoint;
};

export type PatchGraphV1 = {
  modules: PatchModule[];
  connections?: PatchConnection[];
};

export type PatchPortDef = {
  direction: 'in' | 'out';
  wire: string;
  /**
   * `internal` — module plumbing (e.g. building scope); not shown as card I/O.
   * `wire` (default) — host patch canvas endpoint.
   */
  facet?: 'wire' | 'internal';
};

export type PatchModuleTypeCatalog = Record<
  string,
  {
    ports: Record<string, PatchPortDef>;
    /** Omitted = `daily`. */
    mode?: TwinfileUseMode;
  }
>;
