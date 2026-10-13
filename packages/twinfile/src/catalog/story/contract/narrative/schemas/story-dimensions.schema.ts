import { z } from 'zod';

import { EpisodeArcV1Schema } from './episode-arc.schema.js';
import { DramaticBeatIdSchema } from './dramatic-beat.schema.js';

/** Portable 5W+H contract projected from a compiled Story episode. */
export const StoryDimensionWhoSchema = z.object({
  characterId: z.string().min(1),
  characterIds: z.array(z.string().min(1)),
});

export const StoryDimensionWhatSchema = z.object({
  storyId: z.string().min(1),
  arcKind: z.string().min(1).optional(),
});

export const StoryDimensionWhereSchema = z.object({
  placeRefs: z.array(z.string().min(1)),
  primaryPlaceRef: z.string().min(1).optional(),
  spaceIds: z.array(z.string().min(1)).optional(),
});

export const StoryDimensionWhenSchema = z.object({
  simulationEpochStart: z.string().min(1),
  planningHorizonDays: z.number().int().positive(),
  visitDayIndex: z.number().int().nonnegative(),
  storyArc: EpisodeArcV1Schema.optional(),
});

export const StoryDimensionWhySchema = z.object({
  jobIds: z.array(z.string().min(1)).optional(),
  context: z.string().min(1).optional(),
  /** @deprecated Prefer `context`. */
  situation: z.string().min(1).optional(),
  narrativeBeat: z.string().min(1).optional(),
});

export const StoryDimensionHowSchema = z.object({
  journeyPace: z.string().min(1).optional(),
  dramaticBeatIds: z.array(DramaticBeatIdSchema).optional(),
});

export const StoryDimensionsSchema = z.object({
  specVersion: z.literal('1.0'),
  who: StoryDimensionWhoSchema,
  what: StoryDimensionWhatSchema,
  where: StoryDimensionWhereSchema,
  when: StoryDimensionWhenSchema,
  why: StoryDimensionWhySchema.optional(),
  how: StoryDimensionHowSchema.optional(),
});

export function parseStoryDimensions(input: unknown) {
  return StoryDimensionsSchema.parse(input);
}
