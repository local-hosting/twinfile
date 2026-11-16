import { z } from 'zod';

import { normalizeHostContext } from '../../axm/normalize-host.js';
import { AXMKindSchema } from './kind.schema.js';

const AXMHostContextInputSchema = z
  .object({
    kind: AXMKindSchema,
    rubricId: z.string().min(1).optional(),
    /** Host `rubric:` path or id — normalized to `rubricId`. */
    axm: z.string().min(1).optional(),
    ref: z.string().min(1).optional(),
    label: z.string().min(1).optional(),
    zoneId: z.string().min(1).optional(),
  })
  .transform((host) => normalizeHostContext(host));

export const AXMHostContextSchema = AXMHostContextInputSchema;
