import type { Journey } from '@doppler-group/twinfile-character/character';

import { StoryNarrativeSchema } from '../schemas/story-narrative.schema.js';
import type { Story } from '../types/story-narrative.js';
import { validateStoryNarrativeAssociations, type ValidateStoryAssociationsResult } from './validate-story-associations.js';
import { validateStoryNarrativeScenes } from './validate-story-scenes.js';
import { validateStoryNarrativeStoryArc } from './validate-story-story-arc.js';
import { validateStoryNarrativeTouchpointPlaces } from './validate-story-touchpoint-places.js';
import type { StoryTouchpointCatalog } from '../types/touchpoint-catalog.js';

export type ValidateStoryContext = {
  journey?: Journey;
  knownCharacterIds?: readonly string[];
  knownPlaceRefs?: readonly string[];
  touchpointCatalog?: StoryTouchpointCatalog;
};

export type ValidateStoryResult = { ok: true; story: Story } | { ok: false; issues: string[] };

export function validateStoryNarrative(story: Story, context?: ValidateStoryContext): ValidateStoryResult {
  const parsed = StoryNarrativeSchema.safeParse(story);
  if (!parsed.success) {
    return {
      ok: false,
      issues: parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`),
    };
  }
  const normalized = parsed.data as Story;
  const sceneCheck = validateStoryNarrativeScenes(normalized);
  if (!sceneCheck.ok) {
    return sceneCheck;
  }
  const arcCheck = validateStoryNarrativeStoryArc(normalized);
  if (!arcCheck.ok) {
    return arcCheck;
  }
  const associationCheck = validateStoryNarrativeAssociations(normalized, context);
  if (!associationCheck.ok) {
    return associationCheck;
  }

  const placeIssues = validateStoryNarrativeTouchpointPlaces(normalized, context?.touchpointCatalog);
  if (placeIssues.length > 0) {
    return { ok: false, issues: placeIssues };
  }

  return { ok: true, story: normalized };
}

export type { ValidateStoryAssociationsResult };
export { validateStoryNarrativeAssociations } from './validate-story-associations.js';
