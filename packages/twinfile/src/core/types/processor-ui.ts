import type { PatchConnection } from './patch-graph.js';

/** Schema id for framework-agnostic patch canvas payloads (Vue, React, Svelte, canvas2d, …). */
export const TWINFILE_PATCH_UI_SCHEMA = 'twinfile.patch.ui.v1' as const;

export type PatchUiPort = {
  moduleId: string;
  port: string;
  wire: string;
  direction: 'in' | 'out';
};

export type PatchUiModule = {
  id: string;
  type: string;
  bind?: Record<string, string>;
  inputs: PatchUiPort[];
  outputs: PatchUiPort[];
};

export type PatchUiConnection = PatchConnection & {
  wire: string | null;
};

export type PatchUiModel = {
  schema: typeof TWINFILE_PATCH_UI_SCHEMA;
  modules: PatchUiModule[];
  connections: PatchUiConnection[];
};
