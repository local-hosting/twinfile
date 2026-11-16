/** Generated from @doppler-group/twinfile-spec conf/patch-module-types.yaml — run `node scripts/sync-patch-module-types.mjs`. */

export const PATCH_WIRES = [
  "bridge:source",
  "place:building",
  "place:merged",
  "place:site",
  "scenario:args",
  "signal:alert",
  "signal:occupancy",
  "signal:open",
  "signal:rain",
  "signal:rating",
  "signal:status",
  "signal:trigger",
  "signal:volume",
  "twin:layer",
  "twin:metrics",
  "twin:situation"
] as const;

export type PatchWire = (typeof PATCH_WIRES)[number];

export const PATCH_MODULE_TYPE_IDS = [
  "twinfile/mod.bridge-import@0.1.0",
  "twinfile/mod.building-scope@0.1.0",
  "twinfile/mod.map-sink@0.1.0",
  "twinfile/mod.shelter-standup@0.1.0",
  "twinfile/mod.signal-hub@0.1.0",
  "twinfile/mod.site-scope@0.1.0",
  "twinfile/mod.situation-in@0.1.0"
] as const;

export type PatchModuleTypeId = (typeof PATCH_MODULE_TYPE_IDS)[number];

export function isPatchWire(value: string): value is PatchWire {
  return (PATCH_WIRES as readonly string[]).includes(value);
}

export function isPatchModuleTypeId(value: string): value is PatchModuleTypeId {
  return (PATCH_MODULE_TYPE_IDS as readonly string[]).includes(value);
}
