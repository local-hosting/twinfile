import { z } from 'zod';

import { normalizeSAMInput } from '../contract/normalize-sam-input.js';
import { EpisodeArcV1Schema } from './episode-arc.schema.js';
import { StoryArcTemplateSchema } from './story-arc-template.schema.js';
import { PlaceRefSchema, StorySceneSchema } from './scene.schema.js';
import type { SAM } from '../types/sam.js';

export const SAMCharacterRefSchema = z.object({
  pcmId: z.string().min(1),
  role: z.string().min(1).optional(),
  primary: z.boolean().optional(),
});

export const SAMPlaceRefSchema = z.object({
  placeRef: PlaceRefSchema,
  label: z.string().min(1).optional(),
  role: z.string().min(1).optional(),
});

export const SAMBindingSchema = z.object({
  pcmId: z.string().min(1),
  journeyId: z.string().min(1),
  simulationEpochStart: z.string().min(1),
  planningHorizonDays: z.number().int().positive().optional(),
  visitDayIndex: z.number().int().nonnegative().optional(),
});

const SAMCoreSchema = z
  .object({
    version: z.literal(1).default(1),
    id: z.string().min(1),
    title: z.string().min(1),
    revision: z.number().int().nonnegative(),
    summary: z.string().optional(),
    characters: z.array(SAMCharacterRefSchema).min(1),
    places: z.array(SAMPlaceRefSchema).min(1),
    arcTemplate: StoryArcTemplateSchema,
    scenes: z.array(StorySceneSchema).min(1),
    binding: SAMBindingSchema,
    episodeArc: EpisodeArcV1Schema.optional(),
  })
  .superRefine((value, ctx) => {
    if ((value.arcTemplate.acts?.length ?? 0) < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'arcTemplate.acts requires at least 2 beats',
        path: ['arcTemplate', 'acts'],
      });
    }
  });

export const SAMSchema = z.preprocess(normalizeSAMInput, SAMCoreSchema);

export function parseSAM(input: unknown): SAM {
  return SAMSchema.parse(input) as SAM;
}
