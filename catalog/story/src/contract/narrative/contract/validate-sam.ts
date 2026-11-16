import type { Journey } from '@doppler-group/twinfile-character/pcm';

import { SAMSchema } from '../schemas/sam.schema.js';
import type { SAM } from '../types/sam.js';
import { validateSAMAssociations, type ValidateSAMAssociationsResult } from './validate-sam-associations.js';
import { validateSAMScenes } from './validate-sam-scenes.js';
import { validateSAMStoryArc } from './validate-sam-story-arc.js';
import { validateSAMTouchpointPlaces } from './validate-sam-touchpoint-places.js';
import type { SAMTouchpointCatalog } from '../types/touchpoint-catalog.js';

export type ValidateSAMContext = {
  journey?: Journey;
  knownPcmIds?: readonly string[];
  knownPlaceRefs?: readonly string[];
  touchpointCatalog?: SAMTouchpointCatalog;
};

export type ValidateSAMResult = { ok: true; sam: SAM } | { ok: false; issues: string[] };

export function validateSAM(sam: SAM, context?: ValidateSAMContext): ValidateSAMResult {
  const parsed = SAMSchema.safeParse(sam);
  if (!parsed.success) {
    return {
      ok: false,
      issues: parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`),
    };
  }
  const normalized = parsed.data as SAM;
  const sceneCheck = validateSAMScenes(normalized);
  if (!sceneCheck.ok) {
    return sceneCheck;
  }
  const arcCheck = validateSAMStoryArc(normalized);
  if (!arcCheck.ok) {
    return arcCheck;
  }
  const associationCheck = validateSAMAssociations(normalized, context);
  if (!associationCheck.ok) {
    return associationCheck;
  }

  const placeIssues = validateSAMTouchpointPlaces(normalized, context?.touchpointCatalog);
  if (placeIssues.length > 0) {
    return { ok: false, issues: placeIssues };
  }

  return { ok: true, sam: normalized };
}

export type { ValidateSAMAssociationsResult };
export { validateSAMAssociations } from './validate-sam-associations.js';
