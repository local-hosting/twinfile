import { parseManifestPatches } from '@doppler-group/twinfile-core';

export type RegionNavRow = {
  id: string;
  name?: string;
  parent?: string;
};

/** Site spaces that already have a local `copy:` child twin are not listed again as regions. */
export function copyIntoAnchorsFromTwinfile(twinfile: Record<string, unknown>): Set<string> {
  const { instructions } = parseManifestPatches(twinfile);
  const into = new Set<string>();
  for (const step of instructions) {
    if (step.type !== 'copy' || !step.into) continue;
    const copy = step.copy.trim();
    if (copy.startsWith('./') || copy.startsWith('.\\')) into.add(step.into);
  }
  return into;
}

/** Space rows declared inline on this unit's `steps:` (not merged bundle). */
export function spacesFromTwinfileSteps(twinfile: Record<string, unknown>): RegionNavRow[] {
  const { instructions } = parseManifestPatches(twinfile);
  const out: RegionNavRow[] = [];
  const seen = new Set<string>();
  for (const step of instructions) {
    if (step.type !== 'patch') continue;
    const spaces = step.doc.spaces;
    if (!Array.isArray(spaces)) continue;
    for (const row of spaces) {
      if (!row || typeof row !== 'object' || Array.isArray(row)) continue;
      const id = (row as { id?: unknown }).id;
      if (typeof id !== 'string' || seen.has(id)) continue;
      seen.add(id);
      const name = (row as { name?: unknown }).name;
      const parent = (row as { parent?: unknown }).parent;
      out.push({
        id,
        ...(typeof name === 'string' && name.trim() ? { name: name.trim() } : {}),
        ...(typeof parent === 'string' && parent.trim() ? { parent: parent.trim() } : {}),
      });
    }
  }
  return out;
}

export const MAX_REGION_NAV = 24;

/** Rollup regions navigable under a twin when they are not `copy:` anchors. */
export function regionNavFromTwinfile(twinfile: Record<string, unknown>): RegionNavRow[] {
  const into = copyIntoAnchorsFromTwinfile(twinfile);
  const spaces = spacesFromTwinfileSteps(twinfile).filter((row) => !into.has(row.id));
  if (spaces.length === 0 || spaces.length > MAX_REGION_NAV) return [];
  return spaces;
}
