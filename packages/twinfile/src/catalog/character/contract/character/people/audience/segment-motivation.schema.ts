import { z } from 'zod';

export const SegmentReachabilityV1Schema = z.object({
  topAdChannels: z.array(z.string().min(1)).default([]),
  preferredPurchaseChannels: z.array(z.string().min(1)).default([]),
  topQuestions: z.array(z.string().min(1)).default([]),
});

export const SegmentMotivationV1Schema = z.object({
  visitDrivers: z.array(z.string().min(1)).default([]),
  purchaseDrivers: z.array(z.string().min(1)).default([]),
  switchingTriggers: z.array(z.string().min(1)).default([]),
  messagingHooks: z.array(z.string().min(1)).default([]),
  barriers: z.array(z.string().min(1)).default([]),
  reach: SegmentReachabilityV1Schema.optional(),
});

export type SegmentReachabilityV1 = z.infer<typeof SegmentReachabilityV1Schema>;
export type SegmentMotivationV1 = z.infer<typeof SegmentMotivationV1Schema>;

export function isSegmentMotivationV1(value: unknown): value is SegmentMotivationV1 {
  return SegmentMotivationV1Schema.safeParse(value).success;
}
