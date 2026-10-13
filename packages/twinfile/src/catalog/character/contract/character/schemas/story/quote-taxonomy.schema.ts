import { z } from 'zod';

import { coercePlainStringList } from '../coerce-plain-string-list.js';

const TagListSchema = z.preprocess(coercePlainStringList, z.array(z.string().min(1)));

export const QuoteTaxonomySchema = z.object({
  context: TagListSchema.optional(),
  emotion: TagListSchema.optional(),
  painpoint: TagListSchema.optional(),
  aspiration: TagListSchema.optional(),
});

export function parseQuoteTaxonomy(input: unknown) {
  return QuoteTaxonomySchema.parse(input);
}
