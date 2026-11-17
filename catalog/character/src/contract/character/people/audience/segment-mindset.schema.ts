import { z } from 'zod';

export const SegmentBeliefV1Schema = z.object({
  id: z.string().min(1),
  statement: z.string().min(1),
  strength: z.number().min(0).max(1),
});

export const SegmentMindsetV1Schema = z.object({
  think: z.array(z.string().min(1)).default([]),
  feel: z
    .object({
      positive: z.array(z.string().min(1)).default([]),
      negative: z.array(z.string().min(1)).default([]),
    })
    .default({ positive: [], negative: [] }),
  beliefs: z.array(SegmentBeliefV1Schema).default([]),
});

export type SegmentBeliefV1 = z.infer<typeof SegmentBeliefV1Schema>;
export type SegmentMindsetV1 = z.infer<typeof SegmentMindsetV1Schema>;

export function isSegmentMindsetV1(value: unknown): value is SegmentMindsetV1 {
  return SegmentMindsetV1Schema.safeParse(value).success;
}
