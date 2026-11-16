import type { LoadedTwinfile } from './load-twinfile.js';

/** A spatial twin — the only role allowed on a place head. */
export const TWINFILE_UNIT_ROLE = 'place' as const;

/** Timeline playlist — scene `run.yaml`, not a Twinfile. */
export const RUN_PRESET_ROLE = 'run' as const;

export function isRunPresetPath(twinfilePath: string): boolean {
  const norm = twinfilePath.replaceAll('\\', '/');
  return /(^|\/)preset\.ya?ml$/i.test(norm) || /(^|\/)run\.ya?ml$/i.test(norm);
}

export function isRunUnit(loaded: Pick<LoadedTwinfile, 'twinfilePath'>): boolean {
  return isRunPresetPath(loaded.twinfilePath);
}

export function isPlaceTwinfileUnit(loaded: Pick<LoadedTwinfile, 'twinfilePath'>): boolean {
  return !isRunUnit(loaded);
}

/** Run compose head: `from` / `steps` with `copy:` but not a place Twinfile. */
export function isRunComposeHead(doc: Record<string, unknown>): boolean {
  if (doc.geotype) return false;
  if (typeof doc.from === 'string') return true;
  if (doc.role === 'run') return true;
  const steps = doc.steps;
  if (Array.isArray(steps)) {
    return steps.some(
      (row) =>
        row &&
        typeof row === 'object' &&
        typeof (row as { copy?: unknown }).copy === 'string',
    );
  }
  return false;
}
