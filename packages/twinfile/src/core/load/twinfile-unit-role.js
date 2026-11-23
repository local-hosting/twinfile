/** A spatial twin — the only role allowed on a place head. */
export const TWINFILE_UNIT_ROLE = 'place';
/** Story scene run — compose head built from `story.scenes[].run`. */
export const RUN_PRESET_ROLE = 'run';
export function isRunUnit(loaded) {
    return loaded.scene !== undefined;
}
export function isPlaceTwinfileUnit(loaded) {
    return !isRunUnit(loaded);
}
/** Run compose head: `from` / `steps` with `copy:` but not a place Twinfile. */
export function isRunComposeHead(doc) {
    if (doc.geotype)
        return false;
    if (typeof doc.from === 'string')
        return true;
    if (doc.role === 'run')
        return true;
    const steps = doc.steps;
    if (Array.isArray(steps)) {
        return steps.some((row) => row &&
            typeof row === 'object' &&
            typeof row.copy === 'string');
    }
    return false;
}
