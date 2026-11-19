import { z } from 'zod';

import { DramaticBeatIdSchema } from './dramatic-beat.schema.js';
import { StoryArcKindSchema } from './story-arc-kind.schema.js';

export const StoryArcActSchema = z.object({
  id: DramaticBeatIdSchema,
  label: z.string().min(1),
  order: z.number().int().nonnegative(),
  summary: z.string().min(1).optional(),
});

export const StoryArcTemplateSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  kind: StoryArcKindSchema,
  description: z.string().min(1).optional(),
  acts: z.array(StoryArcActSchema).min(1),
});
