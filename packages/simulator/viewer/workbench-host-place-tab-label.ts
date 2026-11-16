import type { WorkbenchCatalogEntry } from './types/workbench-api.js';

const HOST_PLACE_TAB_LABEL_OVERRIDES: Record<string, string> = {
  airport: 'JFK',
  river: 'Tellico River',
  expo: 'Expo City Dubai',
};

/** Short site tab label for the workbench top nav (not full Twinfile `name`). */
export function rootHostPlaceTabLabel(entry: WorkbenchCatalogEntry): string {
  const override = HOST_PLACE_TAB_LABEL_OVERRIDES[entry.id];
  if (override) return override;
  if (!entry.label.trim()) return entry.id;
  return entry.label;
}
