function assetKeyForArg(argKey: string): { assetKey: string; liters: boolean } {
  if (argKey === 'water_liters') return { assetKey: 'water', liters: true };
  return { assetKey: argKey, liters: false };
}

/** Sum stock from merged assets for shelter / relief resource keys. */
export function shelterResourceSupplyFromAssets(
  assets: unknown[],
  resourceKey: string,
  liters: boolean,
): number {
  let sum = 0;
  for (const row of assets) {
    if (!row || typeof row !== 'object') continue;
    const ext = (row as { ext?: Record<string, unknown> }).ext;
    if (!ext) continue;
    const kind = String(ext.shelter_resource ?? ext.relief_resource ?? '');
    if (kind !== resourceKey) continue;
    if (liters) {
      sum += Number(ext.capacity_liters ?? ext.capacity ?? 0);
    } else {
      sum += Number(ext.capacity ?? 0);
    }
  }
  return sum;
}

export function resourceShortfallMetrics(
  place: Record<string, unknown>,
  headcount: number,
  resources: Record<string, unknown> | undefined,
): Array<{ id: string; value: number }> {
  if (!resources || typeof resources !== 'object') return [];
  const assets = (place.assets ?? []) as unknown[];
  const metrics: Array<{ id: string; value: number }> = [];
  for (const [argKey, raw] of Object.entries(resources)) {
    const declared = Number(raw);
    if (!Number.isFinite(declared) || declared < 0) continue;
    const { assetKey, liters } = assetKeyForArg(argKey);
    const fromAssets = shelterResourceSupplyFromAssets(assets, assetKey, liters);
    const supply = Math.max(declared, fromAssets);
    if (supply <= 0) continue;
    const metricId = argKey === 'water_liters' ? 'resource_shortfall_water_liters' : `resource_shortfall_${argKey}`;
    metrics.push({ id: metricId, value: Math.max(0, headcount - supply) });
  }
  return metrics;
}
