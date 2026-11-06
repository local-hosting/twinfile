/** Default canvas = composed card preview, not the declarative <unit>.twin.yaml source. */
export const WORKBENCH_DEFAULT_VARIATION = 'summary';

/** Declarative twinfile (`<unit>.twin.yaml`). */
export const WORKBENCH_TWINFILE_VARIATION = 'twinfile';

export function normalizeWorkbenchVariation(raw: string | undefined | null): string {
  const trimmed = raw?.trim();
  if (!trimmed) return WORKBENCH_DEFAULT_VARIATION;
  if (trimmed === 'source' || trimmed === 'recipe') return WORKBENCH_TWINFILE_VARIATION;
  return trimmed;
}
