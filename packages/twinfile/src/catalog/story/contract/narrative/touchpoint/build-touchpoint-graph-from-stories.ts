import { extractSceneTouchpointRows } from '../scene/extract-scene-touchpoint-rows.js';
import type { Story } from '../types/story-narrative.js';
import type { PlaceMount } from '../types/place-mount.js';
import type { TouchpointGraphWire } from '../types/touchpoint-catalog.js';

export type BuildTouchpointGraphFromStoriesOptions = {
  storyId?: string;
  placeMounts?: readonly PlaceMount[];
};

function inferTouchpointLocus(placeRef: string | undefined): 'physical' | 'digital' | 'blended' | undefined {
  const id = placeRef?.trim().toLowerCase() ?? '';
  if (!id) return undefined;
  if (id.includes('store') || id.includes('venue') || id.includes('airport')) return 'physical';
  if (id.includes('app') || id.includes('mobile') || id.includes('digital')) return 'digital';
  return 'blended';
}

/** Derive a planning touchpoint graph from mounted Story scene touchpoints. */
export function buildTouchpointGraphFromStories(
  stories: readonly Story[],
  options: BuildTouchpointGraphFromStoriesOptions = {},
): TouchpointGraphWire {
  const storyId = options.storyId?.trim();
  const scoped = storyId ? stories.filter((row) => row.id === storyId) : [...stories];
  if (scoped.length === 0) {
    return { touchpoints: [], links: [] };
  }

  const placeMounts = options.placeMounts ?? [];
  const byId = new Map<string, NonNullable<TouchpointGraphWire['touchpoints']>[number]>();
  for (const story of scoped) {
    for (const row of extractSceneTouchpointRows(story.scenes ?? [], { placeMounts })) {
      const id = row.touchpointId.trim();
      if (!id || byId.has(id)) continue;
      byId.set(id, {
        id,
        label: id.replace(/^touchpoint:/, '').replace(/-/g, ' '),
        placeRef: row.placeRef,
        spaceId: row.spaceId,
        locus: inferTouchpointLocus(row.placeRef),
      });
    }
  }

  const touchpoints = [...byId.values()];
  const hub =
    touchpoints.find((row) => row.id.includes('live-map')) ?? touchpoints[touchpoints.length - 1];

  return {
    ...(hub ? { hubTouchpointId: hub.id } : {}),
    touchpoints,
    links: [],
  };
}