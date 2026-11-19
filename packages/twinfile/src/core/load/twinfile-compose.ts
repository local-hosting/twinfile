/** Twinfile 2 Dockerfile steps (`steps:`). Legacy `patches:` / `instructions:` normalize via `twin fmt`. */
export function twinfileStepItems(twinfile: Record<string, unknown>): unknown[] {
  if (Array.isArray(twinfile.steps)) return twinfile.steps;
  if (Array.isArray(twinfile.instructions)) return twinfile.instructions;
  if (Array.isArray(twinfile.patches)) return twinfile.patches;
  return [];
}

export function setTwinfileStepItems(twinfile: Record<string, unknown>, items: unknown[]): void {
  twinfile.steps = items;
  delete twinfile.patches;
  delete twinfile.instructions;
}

/** v2 units: canonical key is `steps:`. */
export function normalizeComposeTwinfileKeys(twinfile: Record<string, unknown>): Record<string, unknown> {
  if (twinfile.twinfile !== 2) return twinfile;
  const items = twinfileStepItems(twinfile);
  if (items.length === 0 && !('patches' in twinfile) && !('instructions' in twinfile) && !('steps' in twinfile)) {
    return twinfile;
  }
  const out: Record<string, unknown> = { ...twinfile, steps: items };
  delete out.patches;
  delete out.instructions;
  return out;
}
