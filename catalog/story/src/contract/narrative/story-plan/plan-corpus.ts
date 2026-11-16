import type {
  SamStoryPlanCatalogBuildInputV1,
  SamStoryPlanCatalogSnapshotV1,
  SamStoryPlanChecklistItemV1,
  SamStoryPlanExtractedHintsV1,
  SamStoryPlanExtractionIndexV1,
  SamStoryPlanInputV1,
} from '../types/story-plan.js';
import {
  intentIdsForSamStoryPlanningSegment,
  readSamStoryPlanSegmentNeedsSummary,
  readSamStoryPlanSegmentTopic,
} from './segment-psychology.js';

export function buildSamStoryPlanCatalogSnapshot(
  input: SamStoryPlanCatalogBuildInputV1,
): SamStoryPlanCatalogSnapshotV1 {
  const segments = input.segments.map((row) => ({
    id: row.id,
    label: row.label,
    topic: readSamStoryPlanSegmentTopic(row),
    needsSummary:
      readSamStoryPlanSegmentNeedsSummary(row, input.customerCatalog) || undefined,
    journeyPace: row.journeyPace,
    intentIds: intentIdsForSamStoryPlanningSegment(row),
  }));

  return {
    segments,
    engagementLevelIds: input.engagementLevelIds,
    intentIds: input.intentIds,
    focusAreaIds: input.focusAreaIds,
    journeyIds: input.journeyIds,
    pcmIds: input.pcmIds,
    samEpisodeIds: input.samEpisodeIds,
    ...(input.storyMenu ? { storyMenu: input.storyMenu } : {}),
    jobIds: input.jobIds,
    fleetPlaces: [...input.fleetPlaces],
    touchpointCount: input.touchpointCount,
    hubTouchpointId: input.hubTouchpointId,
    touchpointIdsSample: [...input.touchpointIdsSample],
    ...(input.axmMenu ? { axmMenu: input.axmMenu } : {}),
  };
}

export function buildSamStoryPlanExtractionIndex(
  catalog: SamStoryPlanCatalogSnapshotV1,
  options?: { storyPlanningGuide?: string },
): SamStoryPlanExtractionIndexV1 {
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
  const axmMenu = catalog.axmMenu;
  return {
    ...(storyPlanningGuide ? { storyPlanningGuide } : {}),
    ...(axmMenu?.characters.length
      ? {
          characters: axmMenu.characters.map((row) => ({
            pcmId: row.pcmId,
            label: row.label,
            journeyIds: [...row.journeyIds],
          })),
        }
      : {}),
    ...(axmMenu?.episodes.length
      ? {
          episodes: axmMenu.episodes.map((row) => ({
            id: row.id,
            title: row.title,
            focalPcmId: row.focalPcmId,
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
    pcmIds: catalog.pcmIds,
    samEpisodeIds: catalog.samEpisodeIds,
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
export function mergeSamStoryPlanInput(
  body: SamStoryPlanInputV1,
  extracted?: SamStoryPlanExtractedHintsV1,
): SamStoryPlanInputV1 {
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
    pcmId: pickString(body.pcmId, extracted.pcmId),
    episodeId: pickString(body.episodeId, extracted.episodeId),
    placeRef: pickString(body.placeRef, extracted.placeRef),
    planningHorizonDays: body.planningHorizonDays ?? extracted.planningHorizonDays,
    visitDayOffset: body.visitDayOffset ?? extracted.visitDayOffset,
    useFeedCalendar: body.useFeedCalendar ?? extracted.useFeedCalendar,
  };
}

export function buildSamStoryPlanChecklist(input: {
  catalog: SamStoryPlanCatalogSnapshotV1;
  segmentId: string;
  storeSlug?: string;
}): SamStoryPlanChecklistItemV1[] {
  return [
    {
      id: 'segments',
      ok: input.catalog.segments.length > 0,
      detail:
        input.catalog.segments.length > 0
          ? `${input.catalog.segments.length} segment(s) in AXM catalog`
          : 'No segments — run admin publish, then retry after sync',
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
