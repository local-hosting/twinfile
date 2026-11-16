import {
  SegmentGeoAudienceInsightSchema,
  type SegmentGeoAudienceInsight,
} from './segment-geo-audience.schema.js';

export const ORG_PERSONA_GEO_AUDIENCE_MAP = 'geoAudience';
export const ORG_PERSONA_GEO_AUDIENCE_ENTRY = 'v1';

export type OrgSegmentGeoAudiencePackV1 = {
  version: 1;
  orgSlug: string;
  updatedAt: string;
  segments: Record<string, SegmentGeoAudienceInsight>;
};

export function isOrgSegmentGeoAudiencePackV1(
  value: unknown,
): value is OrgSegmentGeoAudiencePackV1 {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  if (
    record.version !== 1 ||
    typeof record.orgSlug !== 'string' ||
    typeof record.updatedAt !== 'string' ||
    !record.segments ||
    typeof record.segments !== 'object' ||
    Array.isArray(record.segments)
  ) {
    return false;
  }
  return Object.values(record.segments as Record<string, unknown>).every((segment) =>
    SegmentGeoAudienceInsightSchema.safeParse(segment).success,
  );
}
