import { z } from 'zod';

export const PersonaAttributeSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  values: z.array(z.string().min(1)).min(1),
});
