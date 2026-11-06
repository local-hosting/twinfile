import type { TwinfileUseMode } from '@local-hosting/twinfile';

import { workbenchCatalogEntryVisibleInMode, type WorkbenchCatalogEntryWithMode } from './workbench-catalog-visibility.js';

/** Programme layers use even counts for demo grids; sites are root places only (sub-places stay inline). */
export const WORKBENCH_CATALOG_PARITY_GROUPS = ['scenarios', 'events'] as const;

export const WORKBENCH_ROOT_SITE_COUNT = 11;

export type WorkbenchCatalogParityGroup = (typeof WORKBENCH_CATALOG_PARITY_GROUPS)[number];

export type WorkbenchCatalogEntryRow = WorkbenchCatalogEntryWithMode & { group: string };

export function workbenchCatalogVisibleCount(
  units: WorkbenchCatalogEntryRow[],
  group: WorkbenchCatalogParityGroup,
  mode: TwinfileUseMode,
): number {
  return units.filter((u) => u.group === group).filter((u) => workbenchCatalogEntryVisibleInMode(u, mode)).length;
}

/** Fail fast when a mode would show an odd count in a primary catalog group. */
export function assertWorkbenchCatalogEvenParity(units: WorkbenchCatalogEntryRow[]): void {
  const problems: string[] = [];
  for (const group of WORKBENCH_CATALOG_PARITY_GROUPS) {
    const count = workbenchCatalogVisibleCount(units, group, 'place');
    if (group === 'events' && count <= 1) continue;
    if (count % 2 !== 0) {
      problems.push(`${group}: ${count} visible (expected even)`);
    }
  }
  if (problems.length > 0) {
    throw new Error(`Workbench catalog parity:\n${problems.map((line) => `  - ${line}`).join('\n')}`);
  }
}
