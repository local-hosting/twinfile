import type { LoadedTwinfile } from './load-twinfile.js';

/** A spatial twin — the only role allowed on a place head. */
export const TWINFILE_UNIT_ROLE = 'place' as const;

/** Story scene run — compose head built from `story.scenes[].run`. */
export const RUN_PRESET_ROLE = 'run' as const;

export function isRunUnit(loaded: Pick<LoadedTwinfile, 'scene'>): boolean {
  return loaded.scene !== undefined;
}

export function isPlaceTwinfileUnit(loaded: Pick<LoadedTwinfile, 'scene'>): boolean {
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
