import type {
  StoryPlanNarrativeBuildInputV1,
  StoryPlanNarrativeContextV1,
  StoryPlanSegmentNarrativeV1,
  StoryPlanningSegmentProfileV1,
} from '../types/story-plan.js';
import {
  readStoryPlanSegmentNeedsSummary,
  readStoryPlanSegmentTopic,
  resolveStoryPlanningPrimaryFocusArea,
} from './segment-psychology.js';

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  return value as Record<string, unknown>;
}

function readSegmentMindset(profile: StoryPlanningSegmentProfileV1): string | undefined {
  const cognition = asRecord(profile.cognition);
  const bySegment = asRecord(cognition?.bySegment);
  const row = asRecord(bySegment?.[profile.id]);
  const mindset = row?.mindset;
  return typeof mindset === 'string' && mindset.trim() ? mindset.trim() : undefined;
}

function readEmpathyFeelings(profile: StoryPlanningSegmentProfileV1): {
  positive?: string[];
  negative?: string[];
} {
  const empathy = asRecord(profile.empathy);
  const inner = asRecord(empathy?.empathy);
  const feelings = asRecord(inner?.feelings);
  const positive = Array.isArray(feelings?.positive)
    ? feelings.positive.filter((row): row is string => typeof row === 'string')
    : undefined;
  const negative = Array.isArray(feelings?.negative)
    ? feelings.negative.filter((row): row is string => typeof row === 'string')
    : undefined;
  return { positive, negative };
}

function readSuccessFeeling(profile: StoryPlanningSegmentProfileV1): string | undefined {
  const emotions = asRecord(profile.emotions);
  const inner = asRecord(emotions?.emotions);
  const future = asRecord(inner?.futureEmotions);
  const success = future?.successFeeling;
  return typeof success === 'string' && success.trim() ? success.trim() : undefined;
}

function readOverview(profile: StoryPlanningSegmentProfileV1): {
  name?: string;
  summary?: string;
} {
  const overview = profile.overview;
  if (!overview) return {};
  const description =
    typeof overview.description === 'string' ? overview.description : undefined;
  const legacySummary = asRecord(profile.overview)?.summary;
  const summary =
    typeof legacySummary === 'string'
      ? legacySummary
      : description;
  return {
    name: overview.name,
    summary,
  };
}

function buildSegmentNarrative(
  profile: StoryPlanningSegmentProfileV1,
  input: StoryPlanNarrativeBuildInputV1,
): StoryPlanSegmentNarrativeV1 {
  const overview = readOverview(profile);
  const empathy = readEmpathyFeelings(profile);
  const focusInterest = input.customerCatalog
    ? resolveStoryPlanningPrimaryFocusArea(profile, input.customerCatalog)
    : undefined;
  const focusLabel = focusInterest?.primaryFocusAreaId
    ? input.customerCatalog?.focusAreas?.find(
        (row) => row.id === focusInterest.primaryFocusAreaId,
      )?.label
    : undefined;

  const objectives = (profile.objectives ?? []).map((objective) => ({
    intentId: objective.intentId,
    validEngagementLevelIds: [...(objective.validLevelIds ?? [])],
    touchpointSequenceEngagementKeys: Object.keys(objective.touchpointSequences ?? {}),
  }));

  const suggestedIntentIds = objectives.map((row) => row.intentId).filter(Boolean);
  const topic = readStoryPlanSegmentTopic(profile);
  const needsSummary = readStoryPlanSegmentNeedsSummary(profile, input.customerCatalog);

  return {
    id: profile.id,
    label: profile.label,
    topic,
    needsSummary: needsSummary || undefined,
    journeyPace: profile.journeyPace,
    overviewName: overview.name,
    overviewSummary: overview.summary,
    mindset: readSegmentMindset(profile),
    primaryFocusAreaId: focusInterest?.primaryFocusAreaId,
    primaryFocusAreaLabel: focusLabel,
    empathyPositive: empathy.positive?.slice(0, 6),
    empathyNegative: empathy.negative?.slice(0, 6),
    successFeeling: readSuccessFeeling(profile),
    objectives,
    suggestedIntentIds,
  };
}

export function buildStoryPlanNarrativeContext(
  input: StoryPlanNarrativeBuildInputV1,
): StoryPlanNarrativeContextV1 {
  const segments = input.segments.map((row) => buildSegmentNarrative(row, input));

  const engagementLevels =
    input.customerCatalog?.engagementLevels?.map((row) => ({
      id: row.id,
      label: row.label,
      validIntentIds: row.validIntentIds ? [...row.validIntentIds] : undefined,
    })) ?? [];

  const intents =
    input.customerCatalog?.intents?.map((row) => ({
      id: row.id,
      label: row.label,
    })) ?? [];

  const focusAreas =
    input.customerCatalog?.focusAreas?.map((row) => ({
      id: row.id,
      label: row.label,
    })) ?? [];

  const maxJobs = input.maxJobs ?? 24;
  const jobs = input.jobs ?? [];
  const jobsToBeDone = jobs.slice(0, maxJobs).map((row) => ({
    id: row.id,
    label: row.label,
  }));

  const obstacles = (input.obstacles ?? [])
    .slice(0, 16)
    .map((row) => ({ id: row.id, label: row.label }));

  const maxTp = input.maxTouchpoints ?? 48;
  const touchpoints =
    input.touchpointGraph?.touchpoints?.slice(0, maxTp).map((row) => ({
      id: row.id,
      label: row.label,
      journeyPhase: row.journeyPhase,
      locus: row.locus,
    })) ?? [];

  const storyPlanningGuide = input.storyPlanningGuide?.trim();

  return {
    ...(storyPlanningGuide ? { storyPlanningGuide } : {}),
    planningDefaults: {
      planningHorizonDays: 0,
      useFeedCalendar: true,
      episodePhases:
        'pursue ranked JTBD across touchpoints → primary moment at mounted place → denouement — horizon derived from jobs unless binding fixes days',
    },
    segments,
    engagementLevels,
    intents,
    focusAreas,
    jobsToBeDone,
    obstacles,
    journeys: [...input.journeys],
    touchpoints,
    hubTouchpointId: input.touchpointGraph?.hubTouchpointId,
    fleetPlaces: [...input.fleetPlaces],
  };
}

export function formatStoryPlanLlmUserPrompt(input: {
  scenario: string;
  overrides?: Record<string, unknown>;
  narrative: StoryPlanNarrativeContextV1;
}): string {
  return [
    '## Story scenario',
    input.scenario.trim(),
    '',
    input.narrative.storyPlanningGuide
      ? `## Customer context\n${input.narrative.storyPlanningGuide.trim()}\n`
      : '',
    input.overrides && Object.keys(input.overrides).length > 0
      ? `## Hard overrides (must respect)\n${JSON.stringify(input.overrides, null, 2)}\n`
      : '',
    '## Planning corpus (segments, needs, JTBD, touchpoints, fleet)',
    'First: match the story scenario to the segment whose topic, needsSummary, empathy, and objectives fit.',
    'Episode topic = what that segment is trying to accomplish — not generic retail copy.',
    'Then pick engagementLevelId + intentIds from that segment objectives and the scenario-stated goals.',
    '',
    JSON.stringify(input.narrative, null, 2),
  ]
    .filter(Boolean)
    .join('\n');
}
