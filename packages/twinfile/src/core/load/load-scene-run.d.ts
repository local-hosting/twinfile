import type { Result } from '../types/twin-error.js';
import type { LoadedTwinfile } from './load-twinfile.js';
export type SceneAddress = {
    storyRoot: string;
    sceneId: string;
};
/** `<story-dir>#<scene-id>` → story folder + scene id. */
export declare function parseSceneAddress(target: string): SceneAddress | undefined;
export declare function isSceneAddress(target: string): boolean;
export declare function sceneAddress(storyRoot: string, sceneId: string): string;
/** Path that reloads `loaded`: the scene address for runs, else the unit folder. */
export declare function unitAddress(loaded: Pick<LoadedTwinfile, 'root' | 'scene'>): string;
/** Load a `kind: story` unit folder (not a scene run address). */
export declare function loadStoryUnit(storyRoot: string): Result<LoadedTwinfile>;
/** Scene ids in a story folder that declare an inline `run:`. */
export declare function listSceneRunIds(storyRoot: string): string[];
/** Load one story scene run (`<story-dir>#<scene-id>`) as a compose head. */
export declare function loadRunUnit(target: string): Result<LoadedTwinfile>;
