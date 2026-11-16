import type { Result } from '../types/twin-error.js';

import { loadRunUnit } from './load-run-preset.js';
import { loadTwinfile, type LoadedTwinfile } from './load-twinfile.js';

/** Load a place Twinfile or a run preset directory. */
export function loadUnitRoot(unitRoot: string): Result<LoadedTwinfile> {
  const place = loadTwinfile(unitRoot);
  if (place.ok) return place;
  return loadRunUnit(unitRoot);
}
