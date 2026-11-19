import { z } from 'zod';

/** Preset key for focus-area YAML extensions and mobility-hub journey catalogs. */
export const ArchetypePresetIdSchema = z.string().min(1);

export type ArchetypePresetId = z.infer<typeof ArchetypePresetIdSchema>;
