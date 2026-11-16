import { z } from 'zod';
import {
  TouchpointChannelSchema,
  TouchpointFunnelStageSchema,
  TouchpointTypeSchema,
  VisitorIntentSchema,
} from './touchpoints.schema.js';
import { HeartDimensionIdSchema } from '../shared/heart-dimension-id.schema.js';
import { TouchpointSegmentPreferencesSchema } from '../people/audience/audience-taxonomy.schema.js';

export const JourneyTouchpointTagsSchema = z
  .object({
    intents: z.array(VisitorIntentSchema).optional(),
    stages: z.array(TouchpointFunnelStageSchema).optional(),
    metrics: z.array(z.string().min(1)).optional(),
    segments: z.array(z.string().min(1)).optional(),
    customerSegments: z.array(z.string().min(1)).optional(),
    focus: z.array(z.string().min(1)).optional(),
  })
  .passthrough();

export const JourneyTouchpointVisualAuditSchema = z.record(z.string(), z.unknown());

/** Authoring record for journey touchpoint catalogs (YAML on disk). */
export const JourneyTouchpointRecordSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    type: TouchpointTypeSchema.optional(),
    channel: TouchpointChannelSchema.optional(),
    /** @deprecated Use `channel`. Kept for legacy JSON journey catalogs. */
    context: TouchpointChannelSchema.optional(),
    zoneId: z.string().min(1).optional(),
    label: z.string().min(1).optional(),
    description: z.string().min(1).optional(),
    duration: z.number().positive().optional(),
    heartDimension: HeartDimensionIdSchema.optional(),
    /** @deprecated Use `heartDimension`. Kept for legacy YAML during migration. */
    heartCategory: z.string().min(1).optional(),
    status: z.string().min(1).optional(),
    feature: z.string().min(1).optional(),
    /** Canonical link to `venue/fixtures.yaml` — prefer over free-text `fixture`. */
    fixtureId: z.string().min(1).optional(),
    /** @deprecated Use `fixtureId`. Kept for legacy YAML during migration. */
    fixture: z.string().min(1).optional(),
    location: z.string().min(1).optional(),
    horizon: z.string().min(1).optional(),
    journeyPhases: z.array(z.string().min(1)).optional(),
    journeyImpact: z.string().min(1).optional(),
    directKpis: z.array(z.string().min(1)).optional(),
    visualAudit: JourneyTouchpointVisualAuditSchema.optional(),
    /** Preferred touchpoint affinity keyed by psychographic segment id. */
    segmentPreferences: TouchpointSegmentPreferencesSchema.optional(),
    /** @deprecated Use `segmentPreferences`. Keys are psychographic segment ids, not demographic cohort ids. */
    cohortPreferences: TouchpointSegmentPreferencesSchema.optional(),
    tags: JourneyTouchpointTagsSchema.optional(),
  })
  .passthrough();

export const JourneyTouchpointListFileSchema = z
  .object({
    touchpoints: z.array(JourneyTouchpointRecordSchema),
  })
  .passthrough();

export const JourneyTouchpointZoneCatalogFileSchema = z
  .object({
    zones: z.record(z.string().min(1), z.array(JourneyTouchpointRecordSchema)),
  })
  .passthrough();

export const VenueZoneSchema = z
  .object({
    id: z.string().min(1),
    slug: z.string().min(1),
    name: z.string().min(1),
    jtbdStage: z.string().min(1),
    description: z.string().min(1),
    defaultTouchpoint: z.string().min(1),
  })
  .passthrough();

export const VenueJourneyZonePhaseSchema = z.enum(['pre-store', 'in-store', 'post-store']);

export const VenueZoneFileSchema = z
  .object({
    name: z.string().min(1),
    phase: VenueJourneyZonePhaseSchema,
    description: z.string().min(1),
    zones: z.array(VenueZoneSchema),
  })
  .passthrough();

export const VenueFixtureSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    zoneId: z.string().min(1),
    touchpointId: z.string().min(1).optional(),
  })
  .passthrough();

export const VenueFixtureFileSchema = z
  .object({
    name: z.string().min(1),
    description: z.string().min(1),
    fixtures: z.array(VenueFixtureSchema),
  })
  .passthrough();

export type JourneyTouchpointRecord = z.output<typeof JourneyTouchpointRecordSchema>;
export type JourneyTouchpointListFile = z.output<typeof JourneyTouchpointListFileSchema>;
export type JourneyTouchpointZoneCatalogFile = z.output<typeof JourneyTouchpointZoneCatalogFileSchema>;
export type VenueZone = z.output<typeof VenueZoneSchema>;
export type VenueZoneFile = z.output<typeof VenueZoneFileSchema>;
export type VenueFixture = z.output<typeof VenueFixtureSchema>;
export type VenueFixtureFile = z.output<typeof VenueFixtureFileSchema>;
