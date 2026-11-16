import type { ProjectTwinManifest } from '../project/export-project-twin.js';
import { exportProjectTwinBundle, loadProjectTwinManifest } from '../project/export-project-twin.js';
import { canvasStubEntity } from './canvas-stubs.js';

/** Storage-neutral bundle for optional host canvas import (four twin panels). */
export type CanvasProjectExport = {
  manifest: ProjectTwinManifest;
  place: Record<string, unknown>[];
  resource: Record<string, unknown>[];
  character: Record<string, unknown>[];
  story: Record<string, unknown>[];
};

export function emptyCanvasProjectExport(root?: string): CanvasProjectExport {
  const manifest = loadProjectTwinManifest(root);
  return {
    manifest,
    place: [],
    resource: [],
    character: [],
    story: [],
  };
}

/**
 * Optional host canvas adapter: map project bundle unit ids to panel rows.
 * Live session events belong on the player, not authored twins.
 */
export function canvasEntitiesFromProjectBundle(root?: string): CanvasProjectExport & {
  entityRefs: Array<{ panel: keyof CanvasProjectExport; ref: string }>;
} {
  const bundle = exportProjectTwinBundle(root);
  const manifest = loadProjectTwinManifest(root);
  const entityRefs: Array<{ panel: keyof CanvasProjectExport; ref: string }> = [];
  const panels: CanvasProjectExport = {
    manifest,
    place: [],
    resource: [],
    character: [],
    story: [],
  };
  for (const type of bundle.manifest.types) {
    const panel = type;
    for (const id of bundle.units[type]) {
      panels[panel].push(canvasStubEntity(type, id));
      entityRefs.push({ panel, ref: `twinfile/${type}/${id}` });
    }
  }
  return { ...panels, entityRefs };
}