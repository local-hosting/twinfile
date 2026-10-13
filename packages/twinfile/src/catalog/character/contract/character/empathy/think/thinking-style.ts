import { z } from 'zod';
export const JourneyPaceSchema = z.enum(['slow', 'medium', 'fast']);

export const ThinkingStyleIdSchema = z.string().min(1);

const ThinkingStyleCapabilitiesSchema = z.object({
  services: z.array(z.string().min(1)).default([]),
  curatedTouchpoints: z.array(z.string().min(1)).optional(),
  generatedTouchpoints: z.array(z.string().min(1)).optional(),
});

const ThinkingStyleCoreSchema = z.object({
  innerThinking: z.array(z.string().min(1)).default([]),
  reactions: z.array(z.string().min(1)).optional(),
  guidingPrinciples: z.array(z.string().min(1)).default([]),
  supportingCapabilities: ThinkingStyleCapabilitiesSchema.default({ services: [] }),
});

const ModernThinkingStyleSchema = ThinkingStyleCoreSchema.extend({
  id: ThinkingStyleIdSchema,
  label: z.string().min(1),
});

const LegacyThinkingStyleSchema = ThinkingStyleCoreSchema.extend({
  name: z.string().min(1),
  id: ThinkingStyleIdSchema.optional(),
  label: z.string().min(1).optional(),
});

export interface ThinkingStyle {
  id: string;
  label: string;
  innerThinking: string[];
  reactions?: string[];
  guidingPrinciples: string[];
  supportingCapabilities: {
    services: string[];
    curatedTouchpoints?: string[];
    generatedTouchpoints?: string[];
  };
}

/** Atomic cognitive frame — the reusable thinking style (mental space). */
export const ThinkingStyleSchema: z.ZodType<
  ThinkingStyle,
  z.input<typeof ModernThinkingStyleSchema> | z.input<typeof LegacyThinkingStyleSchema>
> = z
  .union([ModernThinkingStyleSchema, LegacyThinkingStyleSchema])
  .transform((input) => normalizeThinkingStyle(input));

export const ThinkingStyleListSchema = z.object({
  mentalSpaces: z.array(ThinkingStyleSchema).default([]),
});

/** Segment-level mindset summary — WHO the customer is cognitively. */
export const MindsetSchema = z.object({
  summary: z.string().min(1),
  journeyPace: JourneyPaceSchema.optional(),
  dominantStyleIds: z.array(ThinkingStyleIdSchema).optional(),
});

export type JourneyPace = z.infer<typeof JourneyPaceSchema>;
export type Mindset = z.infer<typeof MindsetSchema>;

type LegacyThinkingStyleInput = z.input<typeof LegacyThinkingStyleSchema>;
type ModernThinkingStyleInput = z.input<typeof ModernThinkingStyleSchema>;
type ThinkingStyleInput = LegacyThinkingStyleInput | ModernThinkingStyleInput;

export function thinkingStyleIdFromLabel(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function normalizeThinkingStyle(input: ThinkingStyleInput | ThinkingStyle): ThinkingStyle {
  if ('id' in input && input.id && 'label' in input && input.label) {
    return {
      id: input.id,
      label: input.label,
      innerThinking: input.innerThinking ?? [],
      reactions: input.reactions,
      guidingPrinciples: input.guidingPrinciples ?? [],
      supportingCapabilities: {
        services: input.supportingCapabilities?.services ?? [],
        curatedTouchpoints: input.supportingCapabilities?.curatedTouchpoints,
        generatedTouchpoints: input.supportingCapabilities?.generatedTouchpoints,
      },
    };
  }

  const label = ('name' in input && input.name) || ('label' in input && input.label) || '';
  const id =
    ('id' in input && input.id) || (label ? thinkingStyleIdFromLabel(label) : 'thinking-style');

  return {
    id,
    label: label || id,
    innerThinking: input.innerThinking ?? [],
    reactions: input.reactions,
    guidingPrinciples: input.guidingPrinciples ?? [],
    supportingCapabilities: {
      services: input.supportingCapabilities?.services ?? [],
      curatedTouchpoints: input.supportingCapabilities?.curatedTouchpoints,
      generatedTouchpoints: input.supportingCapabilities?.generatedTouchpoints,
    },
  };
}
