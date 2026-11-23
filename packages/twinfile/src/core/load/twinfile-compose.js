/** Twinfile 2 Dockerfile steps (`steps:`). Legacy `patches:` / `instructions:` normalize via `twin fmt`. */
export function twinfileStepItems(twinfile) {
    if (Array.isArray(twinfile.steps))
        return twinfile.steps;
    if (Array.isArray(twinfile.instructions))
        return twinfile.instructions;
    if (Array.isArray(twinfile.patches))
        return twinfile.patches;
    return [];
}
export function setTwinfileStepItems(twinfile, items) {
    twinfile.steps = items;
    delete twinfile.patches;
    delete twinfile.instructions;
}
/** v2 units: canonical key is `steps:`. */
export function normalizeComposeTwinfileKeys(twinfile) {
    if (twinfile.twinfile !== 2)
        return twinfile;
    const items = twinfileStepItems(twinfile);
    if (items.length === 0 && !('patches' in twinfile) && !('instructions' in twinfile) && !('steps' in twinfile)) {
        return twinfile;
    }
    const out = { ...twinfile, steps: items };
    delete out.patches;
    delete out.instructions;
    return out;
}
