import type { ExpectsRole, PlaceData } from '../build/contract-checker.js';

type RoleRow = { id?: string; roles?: unknown };

const ROWS_BY_KIND: Record<string, string> = {
  space: 'spaces',
  opening: 'openings',
  marker: 'markers',
  gauge: 'gauges',
  station: 'stations',
};

/** Ids of `kind` rows whose `roles` include `roleName`, sorted. */
export function collectPlaceIdsForRole(place: PlaceData, kind: string, roleName: string): string[] {
  const key = ROWS_BY_KIND[kind];
  const rows = (key ? place[key] : undefined) as RoleRow[] | undefined;
  return (rows ?? [])
    .filter((row) => typeof row.id === 'string' && Array.isArray(row.roles) && row.roles.includes(roleName))
    .map((row) => row.id as string)
    .sort((a, b) => a.localeCompare(b));
}

/** Fill each expected role from the place's role tags; warn when a role is under its `min`. */
export function planRolesFromPlace(
  place: PlaceData,
  expects: Record<string, ExpectsRole>,
): { roles: Record<string, string[]>; warnings: string[] } {
  const roles: Record<string, string[]> = {};
  const warnings: string[] = [];
  for (const [roleName, spec] of Object.entries(expects)) {
    const ids = collectPlaceIdsForRole(place, spec.kind, roleName);
    roles[roleName] = ids;
    if (spec.min > 0 && ids.length < spec.min) {
      warnings.push(
        `Role "${roleName}" expects min ${spec.min} ${spec.kind}(s) tagged roles: [${roleName}]; found ${ids.length}`,
      );
    }
  }
  return { roles, warnings };
}
