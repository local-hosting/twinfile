import {
  type BuildTwinfileResult,
} from '@doppler-group/twinfile-place';

export function primaryEventRef(result: BuildTwinfileResult): string {
  const bundled = (result.events ?? []) as Record<string, unknown>[];
  const primary = bundled.at(-1);
  if (primary && typeof primary.id === 'string' && primary.id.length > 0) {
    return primary.id;
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
