import {
  type BuildTwinfileResult,
} from '@doppler-group/twinfile-place';

export function primarySituationRef(result: BuildTwinfileResult): string {
  const bundled = (result.situations ?? []) as Record<string, unknown>[];
  const first = bundled[0];
  if (first && typeof first.id === 'string' && first.id.length > 0) {
    return first.id;
  }
  const steps = result.loaded.twinfile.steps;
  if (Array.isArray(steps)) {
    for (const row of steps) {
      if (!row || typeof row !== 'object') continue;
      const copy = (row as { copy?: unknown }).copy;
      if (typeof copy !== 'string') continue;
      const slug = copy.includes('/') ? copy.split('/').pop()! : copy;
      const withoutVersion = slug.split(':')[0] ?? slug;
      if (withoutVersion) return withoutVersion;
    }
  }
  return 'severe-weather';
}
