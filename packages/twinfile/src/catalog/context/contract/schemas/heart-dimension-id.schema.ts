import { z } from 'zod';
import { HEART_DIMENSIONS } from '../types/heart.js';

const HEART_DIMENSION_ALIASES: Record<string, (typeof HEART_DIMENSIONS)[number]> = {
  taskSuccess: 'task-success',
};

export const HeartDimensionIdSchema = z.preprocess((value) => {
  if (typeof value === 'string' && value in HEART_DIMENSION_ALIASES) {
    return HEART_DIMENSION_ALIASES[value];
  }
  return value;
}, z.enum(HEART_DIMENSIONS));

export type HeartDimensionId = z.infer<typeof HeartDimensionIdSchema>;
