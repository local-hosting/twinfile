import { z } from 'zod';

/** Matches {@link @doppler-group/twinfile-character/persona} `HEART_DIMENSIONS` — kept in Character to avoid subpath export churn in tests. */
export const HEART_DIMENSION_IDS = [
  'happiness',
  'engagement',
  'adoption',
  'retention',
  'task-success',
] as const;

const HEART_DIMENSION_ALIASES: Record<string, (typeof HEART_DIMENSION_IDS)[number]> = {
  taskSuccess: 'task-success',
};

export const HeartDimensionIdSchema = z.preprocess((value) => {
  if (typeof value === 'string' && value in HEART_DIMENSION_ALIASES) {
    return HEART_DIMENSION_ALIASES[value];
  }
  return value;
}, z.enum(HEART_DIMENSION_IDS));

export type HeartDimensionId = z.infer<typeof HeartDimensionIdSchema>;
