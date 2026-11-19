import { statSync } from 'node:fs';
import {
  resolveTwinfileRoot,
  resolveTypeExamplesRoot,
  TWIN_CATALOG_TYPES,
  type TwinCatalogType,
} from '../paths/catalog-layout.js';
import { listExampleUnitIds } from './list-example-units.js';

export type ProjectTwinManifest = {
  twinfile: 1;
  types: TwinCatalogType[];
  roots: Record<string, string>;
};

export type ProjectTwinBundle = {
  manifest: ProjectTwinManifest;
  units: Record<TwinCatalogType, string[]>;
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

/** Storage-neutral project index (`twin list` / `twin project export`, JSON/YAML). */
export function exportProjectTwinBundle(root?: string): ProjectTwinBundle {
  const manifest = loadProjectTwinManifest(root);
  const units = Object.fromEntries(
    TWIN_CATALOG_TYPES.map((type) => [type, listExampleUnitIds(type, root)]),
  ) as ProjectTwinBundle['units'];
  return { manifest, units };
}