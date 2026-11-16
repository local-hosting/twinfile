import type {
  StoryPlanCatalogBuildInputV1,
  StoryPlanCatalogSnapshotV1,
  StoryPlanChecklistItemV1,
  StoryPlanExtractedHintsV1,
  StoryPlanExtractionIndexV1,
  StoryPlanInputV1,
} from '../types/story-plan.js';
import {
  intentIdsForStoryPlanningSegment,
  readStoryPlanSegmentNeedsSummary,
  readStoryPlanSegmentTopic,
} from './segment-psychology.js';

export function buildStoryPlanCatalogSnapshot(
  input: StoryPlanCatalogBuildInputV1,
): StoryPlanCatalogSnapshotV1 {
  const segments = input.segments.map((row) => ({
    id: row.id,
    label: row.label,
    topic: readStoryPlanSegmentTopic(row),
    needsSummary:
      readStoryPlanSegmentNeedsSummary(row, input.customerCatalog) || undefined,
    journeyPace: row.journeyPace,
    intentIds: intentIdsForStoryPlanningSegment(row),
  }));

  return {
    segments,
    engagementLevelIds: input.engagementLevelIds,
    intentIds: input.intentIds,
    focusAreaIds: input.focusAreaIds,
    journeyIds: input.journeyIds,
    characterIds: input.characterIds,
    episodeIds: input.episodeIds,
    ...(input.storyMenu ? { storyMenu: input.storyMenu } : {}),
    jobIds: input.jobIds,
    fleetPlaces: [...input.fleetPlaces],
    touchpointCount: input.touchpointCount,
    hubTouchpointId: input.hubTouchpointId,
    touchpointIdsSample: [...input.touchpointIdsSample],
  };
}

export function buildStoryPlanExtractionIndex(
  catalog: StoryPlanCatalogSnapshotV1,
  options?: { storyPlanningGuide?: string },
): StoryPlanExtractionIndexV1 {
  const segmentLabels: Record<string, string | undefined> = {};
  for (const row of catalog.segments) {
    segmentLabels[row.id] = row.label;
  }
  const storeNames: Record<string, string | undefined> = {};
  for (const row of catalog.fleetPlaces) {
    storeNames[row.slug] = row.name;
  }
  const segments = catalog.segments.map((row) => ({
    id: row.id,
    label: row.label,
    topic: row.topic,
    needsSummary: row.needsSummary,
    intentIds: row.intentIds,
  }));

  const storyPlanningGuide = options?.storyPlanningGuide?.trim();
  const storyMenu = catalog.storyMenu;
  return {
    ...(storyPlanningGuide ? { storyPlanningGuide } : {}),
    ...(storyMenu?.characters.length
      ? {
          characters: storyMenu.characters.map((row) => ({
            characterId: row.characterId,
            label: row.label,
            journeyIds: [...row.journeyIds],
          })),
        }
      : {}),
    ...(storyMenu?.episodes.length
      ? {
          episodes: storyMenu.episodes.map((row) => ({
            id: row.id,
            title: row.title,
            focalCharacterId: row.focalCharacterId,
            journeyId: row.journeyId,
          })),
        }
      : {}),
    segmentIds: catalog.segments.map((row) => row.id),
    segmentLabels,
    segments,
    storeSlugs: catalog.fleetPlaces.map((row) => row.slug),
    storeNames,
    engagementLevelIds: catalog.engagementLevelIds,
    intentIds: catalog.intentIds,
    focusAreaIds: catalog.focusAreaIds,
    journeyIds: catalog.journeyIds,
    characterIds: catalog.characterIds,
    episodeIds: catalog.episodeIds,
    jobIds: catalog.jobIds,
  };
}

function mergeStringArrays(
  primary?: string[],
  secondary?: string[],
): string[] | undefined {
  const merged = [...(primary ?? []), ...(secondary ?? [])]
    .map((row) => row.trim())
    .filter(Boolean);
  const unique = [...new Set(merged)];
  return unique.length > 0 ? unique : undefined;
}

function pickString(explicit?: string, extracted?: string): string | undefined {
  const value = explicit?.trim() || extracted?.trim();
  return value || undefined;
}

/** Explicit plan fields win; extracted NL fields fill gaps. */
export function mergeStoryPlanInput(
  body: StoryPlanInputV1,
  extracted?: StoryPlanExtractedHintsV1,
): StoryPlanInputV1 {
  if (!extracted) {
    return body;
  }

  const constraintNotes = extracted.constraints?.length
    ? `Constraints: ${extracted.constraints.join('; ')}`
    : undefined;
  const notes = [body.notes?.trim(), extracted.notes?.trim(), constraintNotes]
    .filter(Boolean)
    .join('\n');

  const naturalLanguage =
    body.request?.trim() || body.scenario?.trim() || extracted.scenarioSummary?.trim();

  return {
    ...body,
    scenario: naturalLanguage || body.scenario,
    topic: pickString(body.topic, extracted.topic),
    goals: mergeStringArrays(body.goals, extracted.goals),
    jobIds: mergeStringArrays(body.jobIds, extracted.jobIds),
    notes: notes || undefined,
    segmentId: pickString(body.segmentId, extracted.segmentId),
    storeSlug: pickString(body.storeSlug, extracted.storeSlug),
    storeName: pickString(body.storeName, extracted.storeName),
    place: pickString(body.place, extracted.place),
    engagementLevelId: body.engagementLevelId ?? extracted.engagementLevelId,
    intentId: pickString(body.intentId, extracted.intentId),
    focusAreaId: pickString(body.focusAreaId, extracted.focusAreaId),
    interestIds: mergeStringArrays(body.interestIds, extracted.interestIds),
    characterId: pickString(body.characterId, extracted.characterId),
    episodeId: pickString(body.episodeId, extracted.episodeId),
    placeRef: pickString(body.placeRef, extracted.placeRef),
    planningHorizonDays: body.planningHorizonDays ?? extracted.planningHorizonDays,
    visitDayOffset: body.visitDayOffset ?? extracted.visitDayOffset,
    useFeedCalendar: body.useFeedCalendar ?? extracted.useFeedCalendar,
  };
}

export function buildStoryPlanChecklist(input: {
  catalog: StoryPlanCatalogSnapshotV1;
  segmentId: string;
  storeSlug?: string;
}): StoryPlanChecklistItemV1[] {
  return [
    {
      id: 'segments',
      ok: input.catalog.segments.length > 0,
      detail:
        input.catalog.segments.length > 0
          ? `${input.catalog.segments.length} segment(s) in planning catalog`
          : 'No segments — publish planning catalog, then retry',
    },
    {
      id: 'fleet',
      ok: input.catalog.fleetPlaces.length > 0,
      detail:
        input.catalog.fleetPlaces.length > 0
          ? `${input.catalog.fleetPlaces.length} fleet place(s)`
          : 'No fleet stores in catalog',
    },
    {
      id: 'touchpoints',
      ok: input.catalog.touchpointCount > 0,
      detail:
        input.catalog.touchpointCount > 0
          ? `${input.catalog.touchpointCount} touchpoint(s)${input.catalog.hubTouchpointId ? `, hub ${input.catalog.hubTouchpointId}` : ''}`
          : 'Empty touchpoints graph — journey arc will be generic',
    },
    {
      id: 'segment_pick',
      ok: input.catalog.segments.some((row) => row.id === input.segmentId),
      detail: `segmentId \`${input.segmentId}\``,
    },
    {
      id: 'store_pick',
      ok: !input.storeSlug || input.catalog.fleetPlaces.some((row) => row.slug === input.storeSlug),
      detail: input.storeSlug ? `storeSlug \`${input.storeSlug}\`` : 'No store selected',
    },
  ];
}
