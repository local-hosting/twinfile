import { z } from 'zod';
import { MbtiDimensionsSchema, MbtiTypeIdSchema } from '../myers-briggs/myers-briggs.schema.js';
import { PcmAudienceAspectRefSchema } from '../schemas/audience/pcm-audience-plane.schema.js';

/** Known psychographic frameworks shipped with PCM (open `frameworkId` allowed on aspect refs). */
export const PsychographicFrameworkIdSchema = z.enum(['myers_briggs']);

export const PsychographicAspectRefSchema = PcmAudienceAspectRefSchema;

export const PsychographicSchema = z
  .object({
    frameworkId: PsychographicFrameworkIdSchema,
    typeId: MbtiTypeIdSchema,
    label: z.string().min(1),
    nickname: z.string().min(1).optional(),
    dimensions: MbtiDimensionsSchema,
  })
  .describe('Resolved Myers-Briggs profile for one twin.');

export type PsychographicFrameworkId = z.infer<typeof PsychographicFrameworkIdSchema>;
export type PsychographicAspectRef = z.infer<typeof PsychographicAspectRefSchema>;
export type Psychographic = z.infer<typeof PsychographicSchema>;
