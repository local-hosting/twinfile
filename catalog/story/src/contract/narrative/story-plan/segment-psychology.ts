import type {
  StoryPlanningCustomerCatalogV1,
  StoryPlanningFocusInterestV1,
  StoryPlanningSegmentProfileV1,
} from '../types/story-plan.js';

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  return value as Record<string, unknown>;
}

function focusAreaIdsFromSegmentProfile(profile: StoryPlanningSegmentProfileV1): string[] {
  const byFocus = profile.mentalModel?.mentalModel?.byFocus;
  if (!byFocus || typeof byFocus !== 'object') return [];
  return Object.keys(byFocus);
}

export function resolveStoryPlanningPrimaryFocusArea(
  profile: StoryPlanningSegmentProfileV1,
  customerCatalog?: StoryPlanningCustomerCatalogV1,
): StoryPlanningFocusInterestV1 | undefined {
  const segmentFocusIds = focusAreaIdsFromSegmentProfile(profile);
  if (segmentFocusIds.length === 0) return undefined;

  const focusAreas = customerCatalog?.focusAreas ?? [];
  const catalogById = new Map(focusAreas.map((row) => [row.id, row]));
  const ordered = [...segmentFocusIds].sort((left, right) => {
    const leftRank = catalogById.has(left) ? 0 : 1;
    const rightRank = catalogById.has(right) ? 0 : 1;
    if (leftRank !== rightRank) return leftRank - rightRank;
    return left.localeCompare(right);
  });

  return {
    focusAreaIds: ordered,
    primaryFocusAreaId: ordered[0]!,
  };
}

function readOverview(profile: StoryPlanningSegmentProfileV1) {
  const overview = profile.overview;
  if (!overview) return {};
  return {
    name: overview.name,
    description: overview.description,
    aboutTheCustomer: overview.aboutTheCustomer,
    mindset: overview.mindset,
    segmentInsights: overview.segmentInsights,
    watchoutsAndBarriers: overview.watchoutsAndBarriers,
    whatIsAttractive: overview.whatIsAttractive,
  };
}

function readCognitionMindset(profile: StoryPlanningSegmentProfileV1): string | undefined {
  const cognition = asRecord(profile.cognition);
  const bySegment = asRecord(cognition?.bySegment);
  const row = asRecord(bySegment?.[profile.id]);
  const mindset = row?.mindset;
  return typeof mindset === 'string' && mindset.trim() ? mindset.trim() : undefined;
}

function readEmpathyFeelings(profile: StoryPlanningSegmentProfileV1): string[] {
  const empathy = asRecord(profile.empathy);
  const inner = asRecord(empathy?.empathy);
  const feelings = asRecord(inner?.feelings);
  const positive = Array.isArray(feelings?.positive)
    ? feelings.positive.filter((row): row is string => typeof row === 'string')
    : [];
  const negative = Array.isArray(feelings?.negative)
    ? feelings.negative.filter((row): row is string => typeof row === 'string')
    : [];
  return [...positive, ...negative];
}

export function readStoryPlanSegmentTopic(
  profile: StoryPlanningSegmentProfileV1,
): string | undefined {
  const overview = readOverview(profile);
  const candidates = [
    overview.name,
    profile.label,
    overview.description?.split(/[.!?]/)[0]?.trim(),
  ].filter((row): row is string => Boolean(row?.trim()));
  return candidates[0]?.trim();
}

export function readStoryPlanSegmentNeedsSummary(
  profile: StoryPlanningSegmentProfileV1,
  customerCatalog?: StoryPlanningCustomerCatalogV1,
): string {
  const overview = readOverview(profile);
  const parts: string[] = [];
  if (overview.aboutTheCustomer?.trim()) parts.push(overview.aboutTheCustomer.trim());
  if (overview.description?.trim()) parts.push(overview.description.trim());
  const mindset = readCognitionMindset(profile) ?? overview.mindset;
  if (mindset?.trim()) parts.push(`Mindset: ${mindset.trim()}`);
  if (overview.whatIsAttractive?.trim()) {
    parts.push(`Attractive: ${overview.whatIsAttractive.trim()}`);
  }
  if (overview.watchoutsAndBarriers?.trim()) {
    parts.push(`Barriers: ${overview.watchoutsAndBarriers.trim()}`);
  }
  if (overview.segmentInsights?.length) {
    parts.push(`Insights: ${overview.segmentInsights.slice(0, 4).join('; ')}`);
  }
  const feelings = readEmpathyFeelings(profile);
  if (feelings.length > 0) {
    parts.push(`Feelings: ${feelings.slice(0, 6).join('; ')}`);
  }
  const intentIds = (profile.objectives ?? [])
    .map((row) => row.intentId?.trim())
    .filter((id): id is string => Boolean(id));
  if (intentIds.length > 0) {
    parts.push(`Objectives (intents): ${intentIds.join(', ')}`);
  }
  if (customerCatalog) {
    const focus = resolveStoryPlanningPrimaryFocusArea(profile, customerCatalog);
    if (focus?.primaryFocusAreaId) {
      const label = customerCatalog.focusAreas?.find(
        (row) => row.id === focus.primaryFocusAreaId,
      )?.label;
      parts.push(`Primary focus: ${label ?? focus.primaryFocusAreaId}`);
    }
  }
  const joined = parts.join(' ');
  if (joined.length > 480) {
    return `${joined.slice(0, 477)}…`;
  }
  return joined;
}

export function intentIdsForStoryPlanningSegment(
  segment: StoryPlanningSegmentProfileV1,
): string[] {
  const ids = new Set<string>();
  for (const objective of segment.objectives ?? []) {
    if (objective.intentId?.trim()) {
      ids.add(objective.intentId.trim());
    }
  }
  return [...ids];
}
