import { z } from 'zod';

import { EpisodeArcV1Schema } from './episode-arc.schema.js';
import { DramaticBeatIdSchema } from './dramatic-beat.schema.js';

/** Portable 5W+H contract projected from a compiled SAM episode. */
export const SamStoryDimensionWhoSchema = z.object({
  pcmId: z.string().min(1),
  characterIds: z.array(z.string().min(1)),
});

export const SamStoryDimensionWhatSchema = z.object({
  samEpisodeId: z.string().min(1),
  journeyId: z.string().min(1),
  arcKind: z.string().min(1).optional(),
});

export const SamStoryDimensionWhereSchema = z.object({
  placeRefs: z.array(z.string().min(1)),
  primaryPlaceRef: z.string().min(1).optional(),
  spaceIds: z.array(z.string().min(1)).optional(),
});

export const SamStoryDimensionWhenSchema = z.object({
  simulationEpochStart: z.string().min(1),
  planningHorizonDays: z.number().int().positive(),
  visitDayIndex: z.number().int().nonnegative(),
  storyArc: EpisodeArcV1Schema.optional(),
});

export const SamStoryDimensionWhySchema = z.object({
  jobIds: z.array(z.string().min(1)).optional(),
  situation: z.string().min(1).optional(),
  narrativeBeat: z.string().min(1).optional(),
});

export const SamStoryDimensionHowSchema = z.object({
  journeyPace: z.string().min(1).optional(),
  dramaticBeatIds: z.array(DramaticBeatIdSchema).optional(),
});

export const SamStoryDimensionsSchema = z.object({
  specVersion: z.literal('1.0'),
  who: SamStoryDimensionWhoSchema,
  what: SamStoryDimensionWhatSchema,
  where: SamStoryDimensionWhereSchema,
  when: SamStoryDimensionWhenSchema,
  why: SamStoryDimensionWhySchema.optional(),
  how: SamStoryDimensionHowSchema.optional(),
});

export function parseSamStoryDimensions(input: unknown) {
  return SamStoryDimensionsSchema.parse(input);
}
