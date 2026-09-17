import { z } from 'zod';

export const EmpathyFeelingSetSchema = z.object({
  positive: z.array(z.string().min(1)).default([]),
  negative: z.array(z.string().min(1)).default([]),
});

export const EmpathySayingSetSchema = z.object({
  positive: z.array(z.string().min(1)).default([]),
  negative: z.array(z.string().min(1)).default([]),
});

/** Journey-bound inner monologue — THIS MOMENT in a visit phase. */
export const SituationalThoughtSetSchema = z.object({
  thinking: z.array(z.string().min(1)).default([]),
  feeling: EmpathyFeelingSetSchema.optional(),
  saying: EmpathySayingSetSchema.optional(),
  doing: z.array(z.string().min(1)).optional(),
});

/** Full THINK · FEEL · SAY · DO snapshot for a catalog persona exemplar. */
export const PersonaEmpathyMapSchema = z.object({
  think: z.array(z.string().min(1)).default([]),
  feel: EmpathyFeelingSetSchema,
  say: EmpathySayingSetSchema,
  do: z.array(z.string().min(1)).default([]),
});

export type EmpathyFeelingSet = z.infer<typeof EmpathyFeelingSetSchema>;
export type EmpathySayingSet = z.infer<typeof EmpathySayingSetSchema>;
export type SituationalThoughtSet = z.infer<typeof SituationalThoughtSetSchema>;
export type PersonaEmpathyMap = z.infer<typeof PersonaEmpathyMapSchema>;
