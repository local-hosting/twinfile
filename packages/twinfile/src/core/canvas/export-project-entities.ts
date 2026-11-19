import { TWIN_CATALOG_TYPES, type TwinCatalogType } from '../paths/catalog-layout.js';
import type { ProjectTwinManifest } from '../project/export-project-twin.js';
import { exportProjectTwinBundle, loadProjectTwinManifest } from '../project/export-project-twin.js';
import { canvasStubEntity } from './canvas-stubs.js';

/** Storage-neutral bundle for optional host canvas import (one panel per twin type). */
export type CanvasProjectExport = { manifest: ProjectTwinManifest } & Record<TwinCatalogType, Record<string, unknown>[]>;

export function emptyCanvasProjectExport(root?: string): CanvasProjectExport {
  const panels = Object.fromEntries(TWIN_CATALOG_TYPES.map((type) => [type, []]));
  return { manifest: loadProjectTwinManifest(root), ...panels } as CanvasProjectExport;
}

/**
 * Optional host canvas adapter: map project bundle unit ids to panel rows.
 * Live session events belong on the player, not authored twins.
 */
export function canvasEntitiesFromProjectBundle(root?: string): CanvasProjectExport & {
  entityRefs: Array<{ panel: TwinCatalogType; ref: string }>;
} {
  const bundle = exportProjectTwinBundle(root);
  const panels = emptyCanvasProjectExport(root);
  const entityRefs: Array<{ panel: TwinCatalogType; ref: string }> = [];
  for (const type of bundle.manifest.types) {
    for (const id of bundle.units[type]) {
      panels[type].push(canvasStubEntity(type, id));
      entityRefs.push({ panel: type, ref: `twinfile/${type}/${id}` });
    }
  }
  return { ...panels, entityRefs };
}
