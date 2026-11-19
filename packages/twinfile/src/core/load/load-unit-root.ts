import type { Result } from '../types/twin-error.js';

import { isSceneAddress, loadRunUnit } from './load-scene-run.js';
import { loadTwinfile, type LoadedTwinfile } from './load-twinfile.js';

/** Load a place Twinfile or a story scene run (`<story-dir>#<scene-id>`). */
export function loadUnitRoot(unitRoot: string): Result<LoadedTwinfile> {
  return isSceneAddress(unitRoot) ? loadRunUnit(unitRoot) : loadTwinfile(unitRoot);
}
