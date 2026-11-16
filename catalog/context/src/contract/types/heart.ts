/** HEART dimensions — job-nested obstacles may tag which one they mainly move. */
export const HEART_DIMENSIONS = [
  'happiness',
  'engagement',
  'adoption',
  'retention',
  'task-success',
] as const;

export type HeartDimension = (typeof HEART_DIMENSIONS)[number];
