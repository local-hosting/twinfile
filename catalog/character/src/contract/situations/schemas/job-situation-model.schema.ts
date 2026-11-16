import { z } from 'zod';

import { JobSchema } from './job.schema.js';

export const JobSituationModelSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  situation: z.string().min(1),
  revision: z.number().int().nonnegative().optional(),
  jobs: z.array(JobSchema).min(1),
});

export function parseJobSituationModel(input: unknown) {
  return JobSituationModelSchema.parse(input);
}
