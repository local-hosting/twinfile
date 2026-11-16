import { z } from 'zod';

import { JourneySchema } from './story/journey.schema.js';
import { MentalModelSchema } from './strategy/mental-model.schema.js';
import { PCMCharacterSchema } from './pcm-character.schema.js';
import { ThinkingStyleSchema } from './strategy/thinking-style.schema.js';
import { JobSchema } from '../../situations/index.js';
import { ResearchSignalSchema } from './story/research-signal.schema.js';
import { ResearchQuoteSchema } from './story/quote.schema.js';
import { normalizePCMInput } from '../contract/normalize-pcm-input.js';
import type { PCM } from '../types/pcm.js';
import {
  PsychographicSegmentProfileSchema,
  SegmentObjectivesPartSchema,
} from '../people/customer/profile/customer.js';
import {
  SegmentBehaviorBodySchema,
  SegmentEmotionsBodySchema,
  SegmentScenariosSchema,
  SegmentServicesBodySchema,
  SegmentStrategyBodySchema,
} from '../people/customer/profile/segment-facets.js';
import { MentalModelScopeSchema } from '../empathy/think/mental-model.schema.js';

const ObstacleCatalogSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  description: z.string().optional(),
});

const PCMCoreSchema = z.object({
  version: z.literal(1).default(1),
  id: z.string().min(1),
  title: z.string().min(1),
  revision: z.number().int().nonnegative(),
  summary: z.string().optional(),
  persona: PCMCharacterSchema,
  jobs: z.array(JobSchema).optional().default([]),
  journeys: z.array(JourneySchema).optional(),
  quotes: z.array(ResearchQuoteSchema).optional(),
  quoteTaxonomy: z.unknown().optional(),
  mentalModels: z.array(MentalModelSchema).optional(),
  thinkingStyles: z.array(ThinkingStyleSchema).optional(),
  obstacles: z.array(ObstacleCatalogSchema).optional(),
  signals: z.array(ResearchSignalSchema).optional(),
  signalValues: z.record(z.string().min(1), z.number()).optional(),
  overview: PsychographicSegmentProfileSchema.shape.overview,
  visitFrequency: PsychographicSegmentProfileSchema.shape.visitFrequency,
  emotions: SegmentEmotionsBodySchema.optional(),
  behavior: SegmentBehaviorBodySchema.optional(),
  services: SegmentServicesBodySchema.optional(),
  strategy: SegmentStrategyBodySchema.extend({ scenarios: SegmentScenariosSchema.optional() }).optional(),
  mentalModelScope: MentalModelScopeSchema.optional(),
  objectives: SegmentObjectivesPartSchema.shape.objectives.optional(),
});

export const PCMSchema = z.preprocess(normalizePCMInput, PCMCoreSchema);

export function parsePCM(input: unknown): PCM {
  return PCMSchema.parse(input) as PCM;
}
