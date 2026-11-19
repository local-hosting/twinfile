import { z } from 'zod';

import { AXMHostContextSchema } from './context.schema.js';

export const AXMEncounterChannelSchema = z.enum([
  'media',
  'store',
  'website',
  'social',
  'app',
  'map',
]);

export const AXMEncounterModalitySchema = z.enum([
  'physical_space',
  'mobile',
  'web',
  'vr',
  'ar',
  'mr',
  'game',
  'stream',
  'social',
  'wearable',
  'kiosk',
  'venue',
  'vehicle',
  'device',
  'broadcast',
]);

export const AXMEncounterLocusSchema = z.enum(['physical', 'digital', 'blended']);

export const AXMEncounterRoleSchema = z.enum([
  'hub',
  'entry_point',
  'satellite',
  'onsite_companion',
  'blended_bridge',
]);

export const AXMEncounterSchema = z.object({
  channel: AXMEncounterChannelSchema.optional(),
  modality: AXMEncounterModalitySchema.optional(),
  locus: AXMEncounterLocusSchema.optional(),
  role: AXMEncounterRoleSchema.optional(),
  host: AXMHostContextSchema.optional(),
});
