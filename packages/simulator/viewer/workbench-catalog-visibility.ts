import type { TwinfileUseMode } from '@doppler-group/twinfile-core';

export type WorkbenchCatalogEntryWithMode = { mode?: TwinfileUseMode };

/** Catalog entries visible in workbench browse (session chooses active situations at runtime). */
export function workbenchCatalogEntryVisibleInMode(
  _unit: WorkbenchCatalogEntryWithMode,
  _mode?: TwinfileUseMode,
): boolean {
  return true;
}
