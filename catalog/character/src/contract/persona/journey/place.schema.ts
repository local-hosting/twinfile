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
  venueId: z.string().min(1).optional(),
  marketId: z.string().min(1).optional(),
  h3Cell: z.string().min(1).optional(),
  /** Instance zone role (curbside, gate, bedroom) — tenant vocabulary. */
  role: z.string().min(1).optional(),
  /** @deprecated Prefer `role`. */
  geotypeSlug: z.string().min(1).optional(),
});

export type GeoPoint = z.infer<typeof GeoPointSchema>;
export type PlaceRef = z.infer<typeof PlaceRefSchema>;
