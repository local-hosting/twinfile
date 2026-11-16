import { statSync } from 'node:fs';
import { resolveTwinfileRoot, resolveTypeExamplesRoot, TWIN_CATALOG_TYPES } from '../paths/catalog-layout.js';
import { listExampleUnitIds } from './list-example-units.js';

export type ProjectTwinManifest = {
  twinfile: 1;
  types: Array<'place' | 'resource' | 'character' | 'story'>;
  roots: Record<string, string>;
};

export type ProjectTwinBundle = {
  manifest: ProjectTwinManifest;
  units: Record<'place' | 'resource' | 'character' | 'story', string[]>;
};

export function loadProjectTwinManifest(root?: string): ProjectTwinManifest {
  const base = root ?? resolveTwinfileRoot();
  const roots: Record<string, string> = {};
  for (const type of TWIN_CATALOG_TYPES) {
    const examples = resolveTypeExamplesRoot(type, base);
    if (statSync(examples, { throwIfNoEntry: false })?.isDirectory()) {
      roots[type] = examples;
    }
  }
  return { twinfile: 1, types: [...TWIN_CATALOG_TYPES], roots };
}

export { listExampleUnitIds } from './list-example-units.js';

/** Storage-neutral project index (`twin project export`, JSON/YAML). */
export function exportProjectTwinBundle(root?: string): ProjectTwinBundle {
  const manifest = loadProjectTwinManifest(root);
  const units = {
    place: listExampleUnitIds('place', root),
    resource: listExampleUnitIds('resource', root),
    character: listExampleUnitIds('character', root),
    story: listExampleUnitIds('story', root),
  };
  return { manifest, units };
}