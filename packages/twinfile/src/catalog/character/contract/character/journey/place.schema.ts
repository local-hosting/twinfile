import { isTwinfileRef } from '@local-hosting/twinfile/ref';
import { z } from 'zod';

export const GeoPointSchema = z.object({
  lat: z.number(),
  lon: z.number(),
});

export const PlaceRefSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1).optional(),
  lat: z.number().optional(),
  lon: z.number().optional(),
  /** Published Twinfile place unit for this anchor (kind + name identify the place). */
  placeRef: z.string().refine(isTwinfileRef, 'placeRef must be a Twinfile ref').optional(),
  marketId: z.string().min(1).optional(),
  h3Cell: z.string().min(1).optional(),
  /** Instance zone role (curbside, gate, bedroom) — tenant vocabulary. */
  role: z.string().min(1).optional(),
  /** @deprecated Prefer `role`. */
  geotypeSlug: z.string().min(1).optional(),
});

export type GeoPoint = z.infer<typeof GeoPointSchema>;
export type PlaceRef = z.infer<typeof PlaceRefSchema>;
