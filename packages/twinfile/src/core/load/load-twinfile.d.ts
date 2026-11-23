import type { LoadedScene } from '../types/scene-run.js';
import type { Result } from '../types/twin-error.js';
export type LoadedTwinfile = {
    root: string;
    twinfilePath: string;
    twinfile: Record<string, unknown>;
    /** Set when the unit is a story scene run (`<story-dir>#<scene-id>`). */
    scene?: LoadedScene;
};
export declare function loadTwinfile(unitRoot: string): Result<LoadedTwinfile>;
export declare function validateTwinfileYamlPath(twinfilePath: string): Result<Record<string, unknown>>;
export declare function validatePlaceYamlPath(layerPath: string): Result<unknown>;
