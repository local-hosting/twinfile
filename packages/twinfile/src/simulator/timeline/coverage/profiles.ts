import type { CoverageProfileDef, CoverageProtocol } from './types.js';

const BUILTIN: CoverageProfileDef[] = [
  {
    id: 'twinfile-wifi-v0',
    engine: 'graph-v0',
    protocol: 'wifi',
    pl0: 40,
    path_loss_n: 2.5,
    exposure_db: { outdoor: 0, covered: 4, indoor: 12, '(unset)': 8 },
    route_kind_db: { corridor: 2, path: 0, stair: 8, ramp: 3, elevator: 6 },
    opening_db: 5,
    opening_path_m: 8,
    same_space_offset_db: -40,
    default_tx_power_dbm: 20,
  },
  {
    id: 'twinfile-ble-v0',
    engine: 'graph-v0',
    protocol: 'ble',
    pl0: 35,
    path_loss_n: 2.2,
    exposure_db: { outdoor: 0, covered: 3, indoor: 10, '(unset)': 6 },
    route_kind_db: { corridor: 1, path: 0 },
    opening_db: 4,
    opening_path_m: 6,
    same_space_offset_db: -35,
    default_tx_power_dbm: 4,
    max_range_m: 40,
  },
  {
    id: 'twinfile-lora-v0',
    engine: 'graph-v0',
    protocol: 'lora',
    pl0: 32,
    path_loss_n: 2.8,
    exposure_db: { outdoor: 0, covered: 6, indoor: 18, '(unset)': 10 },
    route_kind_db: { path: 0 },
    opening_db: 8,
    opening_path_m: 15,
    same_space_offset_db: -30,
    default_tx_power_dbm: 14,
    max_range_m: 2000,
  },
];

function normalizeProfile(row: Record<string, unknown>): CoverageProfileDef | null {
  const id = row.id;
  const protocol = row.protocol;
  if (typeof id !== 'string' || typeof protocol !== 'string') return null;
  if (protocol !== 'wifi' && protocol !== 'ble' && protocol !== 'lora') return null;
  return {
    id,
    engine: row.engine === 'graph-v0' ? 'graph-v0' : undefined,
    protocol,
    ...(typeof row.pl0 === 'number' ? { pl0: row.pl0 } : {}),
    ...(typeof row.path_loss_n === 'number' ? { path_loss_n: row.path_loss_n } : {}),
    ...(row.exposure_db && typeof row.exposure_db === 'object' && !Array.isArray(row.exposure_db)
      ? { exposure_db: row.exposure_db as CoverageProfileDef['exposure_db'] }
      : {}),
    ...(row.route_kind_db && typeof row.route_kind_db === 'object' && !Array.isArray(row.route_kind_db)
      ? { route_kind_db: row.route_kind_db as CoverageProfileDef['route_kind_db'] }
      : {}),
    ...(typeof row.opening_db === 'number' ? { opening_db: row.opening_db } : {}),
    ...(typeof row.opening_path_m === 'number' ? { opening_path_m: row.opening_path_m } : {}),
    ...(typeof row.same_space_offset_db === 'number' ? { same_space_offset_db: row.same_space_offset_db } : {}),
    ...(typeof row.default_tx_power_dbm === 'number' ? { default_tx_power_dbm: row.default_tx_power_dbm } : {}),
    ...(typeof row.max_range_m === 'number' ? { max_range_m: row.max_range_m } : {}),
  };
}

export function mergeProfiles(mergedPlace: Record<string, unknown>): Map<string, CoverageProfileDef> {
  const map = new Map<string, CoverageProfileDef>();
  for (const base of BUILTIN) map.set(base.id, { ...base });

  for (const row of (mergedPlace.coverage_profiles ?? []) as Array<Record<string, unknown>>) {
    const parsed = normalizeProfile(row);
    if (!parsed) continue;
    const prev = map.get(parsed.id);
    map.set(parsed.id, prev ? { ...prev, ...parsed } : parsed);
  }
  return map;
}

export function defaultProfileForProtocol(protocol: CoverageProtocol): CoverageProfileDef {
  const id =
    protocol === 'wifi' ? 'twinfile-wifi-v0' : protocol === 'ble' ? 'twinfile-ble-v0' : 'twinfile-lora-v0';
  const hit = mergeProfiles({}).get(id);
  if (!hit) throw new Error(`missing built-in coverage profile ${id}`);
  return hit;
}

export function resolveProfile(
  mergedPlace: Record<string, unknown>,
  profileId: string | undefined,
  protocol: CoverageProtocol,
): CoverageProfileDef {
  const profiles = mergeProfiles(mergedPlace);
  if (profileId) {
    const hit = profiles.get(profileId);
    if (!hit) throw new Error(`unknown coverage profile "${profileId}"`);
    if (hit.protocol !== protocol) {
      throw new Error(`coverage profile "${profileId}" is ${hit.protocol}, radio is ${protocol}`);
    }
    return hit;
  }
  return defaultProfileForProtocol(protocol);
}
