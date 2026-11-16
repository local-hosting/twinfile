import { z } from 'zod';

export const SegmentInterestV1Schema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  slug: z.string().min(1).optional(),
  themes: z.array(z.string().min(1)).default([]),
  description: z.string().min(1).optional(),
});

export type SegmentInterestV1 = z.infer<typeof SegmentInterestV1Schema>;

export function isSegmentInterestV1(value: unknown): value is SegmentInterestV1 {
  return SegmentInterestV1Schema.safeParse(value).success;
}
