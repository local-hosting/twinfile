import { isTwinfileRef } from '@doppler-group/twinfile-core/ref';
import { z } from 'zod';

import { coalesceJobIdsFields } from './coalesce-job-ids.js';
import { SceneBeatIdSchema } from './dramatic-beat.schema.js';

/** Twinfile place unit ref; scenes and `sam.places` match on kind + name. */
export const PlaceRefSchema = z.string().trim().refine(isTwinfileRef, 'placeRef must be a Twinfile ref');

export const SceneEmotionBandSchema = z.enum(['low', 'mid', 'high']);

export const SceneEmotionValenceSchema = z.enum(['negative', 'neutral', 'positive']);

export const SceneEmotionsSchema = z.object({
  band: SceneEmotionBandSchema.optional(),
  valence: SceneEmotionValenceSchema.optional(),
  feelings: z.array(z.string().min(1)).optional(),
  curve: z.number().min(-1).max(1).optional(),
});

const withCoalescedSceneFields = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess(
    (raw) => {
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
        return raw;
      }
      return coalesceJobIdsFields(raw as Record<string, unknown>);
    },
    schema,
  );

export const SceneCharacterBeatSchema = withCoalescedSceneFields(
  z.object({
    pcmId: z.string().min(1),
    jobIds: z.array(z.string().min(1)).optional(),
    emotions: SceneEmotionsSchema.optional(),
    pain: z.string().min(1).optional(),
    gain: z.string().min(1).optional(),
  }),
);

export const StorySceneTouchpointRefSchema = withCoalescedSceneFields(
  z.object({
    id: z.string().min(1),
    placeRef: PlaceRefSchema.optional(),
    spaceId: z.string().min(1).optional(),
  }),
);

export const StorySceneSchema = withCoalescedSceneFields(
  z.object({
    id: z.string().min(1),
    label: z.string().min(1),
    order: z.number().int().nonnegative(),
    actId: SceneBeatIdSchema,
    narrativeBeat: z.string().min(1).optional(),
    situation: z.string().min(1).optional(),
    characterIds: z.array(z.string().min(1)).min(1),
    placeRef: PlaceRefSchema,
    spaceId: z.string().min(1).optional(),
    visitMomentId: z.string().min(1).optional(),
    touchpoints: z.array(StorySceneTouchpointRefSchema).optional(),
    touchpointIds: z.array(z.string().min(1)).optional(),
    journeyPhaseId: z.string().min(1).optional(),
    journeyMomentId: z.string().min(1).optional(),
    jobIds: z.array(z.string().min(1)).optional(),
    emotions: SceneEmotionsSchema.optional(),
    cast: z.array(SceneCharacterBeatSchema).optional(),
    pain: z.string().min(1).optional(),
    gain: z.string().min(1).optional(),
  }),
);
