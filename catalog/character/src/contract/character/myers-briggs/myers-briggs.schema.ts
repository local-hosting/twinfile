import { z } from 'zod';

export const MbtiPoleIdSchema = z.enum(['E', 'I', 'S', 'N', 'T', 'F', 'J', 'P']);

export const MbtiDimensionIdSchema = z.enum(['energy', 'perception', 'deciding', 'lifestyle']);

export const MbtiTypeIdSchema = z.enum([
  'INTJ',
  'INTP',
  'ENTJ',
  'ENTP',
  'INFJ',
  'INFP',
  'ENFJ',
  'ENFP',
  'ISTJ',
  'ISFJ',
  'ESTJ',
  'ESFJ',
  'ISTP',
  'ISFP',
  'ESTP',
  'ESFP',
]);

export const MBTI_TYPE_IDS = MbtiTypeIdSchema.options;

export const MbtiDimensionsSchema = z.object({
  energy: z.enum(['E', 'I']),
  perception: z.enum(['S', 'N']),
  deciding: z.enum(['T', 'F']),
  lifestyle: z.enum(['J', 'P']),
});

export const MbtiDimensionDefinitionSchema = z.object({
  id: MbtiDimensionIdSchema,
  label: z.string().min(1),
  question: z.string().min(1),
  poles: z
    .array(
      z.object({
        id: MbtiPoleIdSchema,
        label: z.string().min(1),
      }),
    )
    .length(2),
});

export const MbtiTypeDefinitionSchema = z.object({
  id: MbtiTypeIdSchema,
  label: z.string().min(1),
  dimensions: MbtiDimensionsSchema,
});

export const MyersBriggsCatalogSchema = z
  .object({
    specVersion: z.literal('1.0').default('1.0'),
    frameworkId: z.literal('myers_briggs'),
    label: z.string().min(1),
    dimensions: z.array(MbtiDimensionDefinitionSchema).length(4),
    types: z.array(MbtiTypeDefinitionSchema).min(1),
  })
  .describe('Myers-Briggs personality type catalog.');

export type MbtiPoleId = z.infer<typeof MbtiPoleIdSchema>;
export type MbtiDimensionId = z.infer<typeof MbtiDimensionIdSchema>;
export type MbtiTypeId = z.infer<typeof MbtiTypeIdSchema>;
export type MbtiDimensions = z.infer<typeof MbtiDimensionsSchema>;
export type MbtiDimensionDefinition = z.infer<typeof MbtiDimensionDefinitionSchema>;
export type MbtiTypeDefinition = z.infer<typeof MbtiTypeDefinitionSchema>;
export type MyersBriggsCatalog = z.infer<typeof MyersBriggsCatalogSchema>;
