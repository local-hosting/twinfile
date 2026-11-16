import type { TwinfileUseMode } from '@local-hosting/twinfile-core';

export type PlaceRowWithRoles = { roles?: unknown; [key: string]: unknown };

/** All place rows visible in the single place view. */
export function placeRowMatchesUseMode(_row: PlaceRowWithRoles, _mode?: TwinfileUseMode): boolean {
  return true;
}

export function filterPlaceRowsByUseMode<T extends Record<string, unknown>>(rows: T[], _mode?: TwinfileUseMode): T[] {
  return rows;
}
