/**
 * Browser-safe SAM surface — no disk `loadSAM` or YAML tree I/O.
 * @packageDocumentation
 */

export type { SAM, SAMBinding, SAMDocument } from './types/sam.js';
export type { SAMCharacterRef, SAMVenueRef } from './types/sam-refs.js';
export type { DramaticBeatId } from './types/dramatic-beat.js';
export { DRAMATIC_BEAT_IDS } from './types/dramatic-beat.js';
export type {
  SamCatalogCharacterRef,
  SamCatalogEpisodeRef,
  SamCatalogVenueRef,
  SamStoryCatalogMenuV1,
  SamStorySelectionV1,
} from './types/story-catalog-menu.js';
export type { StoryArcKind } from './types/story-arc-kind.js';
export { STORY_ARC_KINDS } from './types/story-arc-kind.js';
export type { StoryArcAct, StoryArcTemplate } from './types/story-arc-template.js';
export {
  WRITE_PRACTICE_ARC_PRESETS,
  defaultActsForStoryArcKind,
  type WritePracticeArcPreset,
} from './story-arc/write-practice-presets.js';
export {
  buildStoryArcTemplateFromKind,
  generateSamEpisodeFromArc,
  scaffoldScenesFromJourneyArc,
  type BuildStoryArcTemplateFromKindInput,
  type GeneratedSamEpisodeDraft,
  type GenerateSamEpisodeFromArcInput,
  type ScaffoldScenesFromJourneyArcInput,
} from './story-arc/generate-from-arc-kind.js';
export type { SceneEmotions, StoryScene } from './types/scene.js';
export {
  SAM_SPEC_VERSION,
  assertSupportedSAMSpec,
  samSpecVersion,
  type SAMSpecVersion,
} from './types/sam-spec.js';
export { SAM_PACKAGE } from './contract/sam-package-meta.js';
export type {
  EpisodeArcV1,
  EpisodePhaseId,
  EpisodeTouchpointScheduleEntry,
} from './types/episode-arc.js';
export {
  DEFAULT_PLANNING_HORIZON_DAYS,
  MIN_PLANNING_HORIZON_DAYS,
} from './types/episode-arc.js';
export type { TouchpointIndex, TouchpointIndexEntry } from './types/touchpoint-index.js';
export { touchpointIndexFromIds, touchpointIndexMap } from './types/touchpoint-index.js';
export type {
  BuildEpisodeCalendarDaysInput,
  EpisodeCalendarByIsoDate,
  EpisodeCalendarClock,
  EpisodeCalendarDays,
  EpisodeCalendarScheduledTouchpoint,
  GenerateEpisodeCalendarFromScenes,
  GenerateEpisodeCalendarFromSequence,
  GenerateEpisodeCalendarInput,
  GenerateEpisodeCalendarResult,
} from './types/episode-calendar-generator.js';
export {
  buildEpisodeCalendarDays,
  generateEpisodeCalendar,
  generateEpisodeCalendarFromScenes,
} from './calendar/generate-episode-calendar.js';
export {
  buildEpisodeActivityCalendar,
  type BuildEpisodeActivityCalendarInput,
} from './calendar/build-episode-activity-calendar.js';
export { isIsoDateString, parseIsoDateUtc, simulationDateIso } from './calendar/simulation-date.js';
export {
  defaultStoryClockHour,
  resolveStoryClockDayIndex,
  resolveStoryClockPosition,
  type StoryClockAdvanceTarget,
  type StoryClockPosition,
} from './clock/story-clock.js';
export {
  defaultStoryClockCursor,
  hourOfDayFromWireCursor,
  storyClockCursorFromWire,
  storyClockCursorToWire,
  type StoryClockCursor,
  type StoryClockCursorWire,
} from './clock/story-clock-cursor.js';
export {
  resolveActivityAtHour,
  resolveStoryBeat,
  type StoryBeatSnapshot,
} from './story/resolve-story-beat.js';
export {
  advanceStoryClockForArc,
} from './story/advance-story-clock.js';
export {
  assembleSamStoryRun,
  resolveDayActivitiesFromTimelineWire,
  type AssembledSamStoryRun,
} from './story/assemble-story-run.js';
export {
  planSamStoryEpisodeCalendar,
  type PlanSamStoryEpisodeCalendarInput,
  type PlanSamStoryEpisodeCalendarResult,
} from './story/plan-story-episode-calendar.js';
export {
  planEpisodeCalendarFromArc,
  type PlanEpisodeCalendarResult,
} from './story/plan-episode-calendar.js';
export type {
  StoryTimelineActivityWire,
  StoryTimelineDayWire,
  StoryTimelineHostWire,
} from './story/timeline-host-wire.js';
export type { SamStoryRunState } from './types/story-run.js';
export type {
  EpisodeActivityCalendar,
  EpisodeActivityDay,
  EpisodeActivityKind,
  EpisodeScheduledActivity,
} from './types/episode-activity.js';
export type { SAMCharacterContext } from './types/sam-character-context.js';
export type { SAMPlaceMount, PlaceMount, TwinfilePlaceMount } from './types/venue-mount.js';
export {
  findSceneVenueKeysOutsidePlaceMounts,
  placeMountByVenueKey,
  resolveSceneSpaceId,
} from './place/venue-mount-catalog.js';
export {
  mergePlaceMountsByVenueKey,
  minimalPlaceMount,
  minimalPlaceMountFromGeoAnchor,
} from './place/minimal-place-mount.js';
export { placeMountFromHostUnit } from './place/place-mount-from-host-unit.js';
export { placeMountFromPlaceRef } from './place/place-mount-from-place-ref.js';
export {
  distanceKmBetween,
  rankPlaceMountsNearAnchor,
  type GeoAnchorV1,
} from './venue/rank-venues-near-anchor.js';
export {
  extractSceneTouchpointRows,
  type SceneTouchpointRow,
} from './scene/extract-scene-touchpoint-rows.js';
export {
  resolveJourneyFromCharacterContext,
  resolvePcmForCharacter,
} from './contract/resolve-character-context.js';
export {
  buildEpisodeTouchpointScheduleFromSceneRows,
} from './episode/materialize-episode-arc.js';
export type {
  SAMTouchpointCatalog,
  SAMTouchpointDefinition,
  SAMTouchpointLink,
  SAMTouchpointLocus,
  TouchpointGraphWire,
} from './types/touchpoint-catalog.js';
export {
  resolveTouchpointLabel,
  touchpointCatalogFromWire,
  touchpointIndexFromCatalog,
} from './touchpoint/touchpoint-catalog.js';
export {
  listSceneTouchpointRefs,
  resolveTouchpointDefinition,
  resolveTouchpointVenueAtScene,
  touchpointRequiresVenue,
} from './touchpoint/resolve-touchpoint-venue.js';
export type { StorySceneTouchpointRef, SceneCharacterBeat } from './types/scene.js';
export { hydrateSceneFromJourney, hydrateScenesFromJourney } from './scene/hydrate-scene-from-journey.js';
export type { EpisodeCalendarResources } from './types/episode-calendar-generator.js';

export {
  validateSAM,
  validateSAMAssociations,
  type ValidateSAMResult,
  type ValidateSAMContext,
  type ValidateSAMAssociationsResult,
} from './contract/validate-sam.js';
export { samToJSON, samFromJSON, type SamJson } from './contract/json.js';
export { SamDocument } from './contract/sam-document.js';
export {
  SamStoryInstanceDocument,
  storyCharacteristicsFromJSON,
  type SamStoryInstanceJson,
  type SamStoryRuntimeWire,
  type StoryCharacteristics,
} from './story/sam-story-instance-document.js';
export { parseSAM, SAMSchema } from './schemas/sam.schema.js';
export {
  EpisodeArcV1Schema,
  EpisodePhaseIdSchema,
  EpisodeTouchpointScheduleEntrySchema,
} from './schemas/episode-arc.schema.js';
export {
  parseSamStoryDimensions,
  SamStoryDimensionHowSchema,
  SamStoryDimensionWhatSchema,
  SamStoryDimensionWhenSchema,
  SamStoryDimensionWhereSchema,
  SamStoryDimensionWhoSchema,
  SamStoryDimensionWhySchema,
  SamStoryDimensionsSchema,
} from './schemas/story-dimensions.schema.js';
export { compileSAM, type CompileSAMInput, type CompileSAMResult } from './contract/compile-sam.js';

export { extractJourneyTouchpointSequence } from './journey/extract-touchpoint-sequence.js';
export { validateJourneyBindings, type ValidateJourneyBindingsResult } from './journey/validate-journey-bindings.js';
export { resolveJourneyById, requireJourneyById } from './journey/resolve-journey.js';
export { classifyTouchpointPhase } from './journey/classify-touchpoint-phase.js';

export { buildEpisodeTouchpointSchedule } from './episode/materialize-episode-arc.js';
export {
  DEFAULT_EPISODE_TIMING_VARIATION,
  resolveEpisodeTimingVariation,
  resolvePlanningHorizonDays,
  resolveRandomPlanningHorizonDays,
  resolveVisitDayIndex,
  type EpisodeTimingVariation,
} from './episode/planning-horizon.js';
export { materializeEpisodeArcFromScenes } from './episode/materialize-episode-arc-from-sequence.js';
export { extractTouchpointSequenceFromScenes } from './scene/extract-touchpoint-sequence-from-scenes.js';
export { validateSAMScenes, type ValidateSAMScenesResult } from './contract/validate-sam-scenes.js';
export {
  validateSamNarrativeCoherence,
  type ValidateSamNarrativeCoherenceResult,
} from './contract/validate-sam-narrative-coherence.js';
export { validateSAMStoryArc, type ValidateSAMStoryArcResult } from './contract/validate-sam-story-arc.js';

export type {
  SamJourney,
  SamJourneyContext,
  SamJourneyNeed,
  SamJourneyPhase,
  SamJourneyTouchpoint,
} from './types/sam-journey.js';
export { resolveJourneyForSam } from './journey/build/resolve-journey-for-sam.js';
export {
  buildSamStoryCatalogMenu,
  samStoryCatalogMenuHasEpisodes,
} from './story-catalog/build-sam-story-catalog-menu.js';
export {
  resolveSamEpisode,
  type ResolveSamEpisodeSelection,
  type SamEpisodeMountV1,
} from './story-catalog/resolve-sam-episode.js';
export { compileSamsForCatalog } from './story-catalog/compile-sams-for-catalog.js';
export type {
  SamStoryDimensionsV1,
  SamStoryDimensionWhoV1,
  SamStoryDimensionWhatV1,
  SamStoryDimensionWhereV1,
  SamStoryDimensionWhenV1,
  SamStoryDimensionWhyV1,
  SamStoryDimensionHowV1,
} from './types/story-dimensions.js';
export {
  projectStoryDimensionsFromSam,
  type ProjectStoryDimensionsFromSamInput,
} from './project/project-story-dimensions-from-sam.js';
export { buildJourney, buildJourneyFromBinding } from './journey/build/build-journey.js';
export { formatJourneyMarkdown } from './journey/build/format-journey-markdown.js';
export { journeyFileBasename } from './journey/build/journey-file-basename.js';
export type {
  SamStoryPlanCatalogSnapshotV1,
  SamStoryPlanFleetVenueSnapshotV1,
  SamStoryPlanSegmentObjectiveV1,
  SamStoryPlanSegmentSnapshotV1,
} from './types/story-plan-catalog.js';
export {
  pickRandomEngagementLevel,
  pickRandomFocusAreaId,
  pickRandomFrom,
  pickRandomIndex,
  pickRandomIntentId,
  pickRandomJourneyId,
  pickRandomPlanningHorizonDays,
  pickRandomSegmentIdFromCatalog,
  pickRandomStoryPlanStoreSlug,
  pickRandomVisitDayIndex,
} from './story-plan/random.js';
export {
  createStoryPlanChance,
  resolveStoryPlanRandom,
  storyPlanRandomFromChance,
  type StoryPlanRandomSource,
} from './story-plan/rng.js';
export {
  normalizeScenarioText,
  scenarioTokenSet,
  scoreFleetVenueScenarioMatch,
  scoreScenarioTokenOverlap,
} from './story-plan/scenario-scoring.js';
export {
  planStoryCreateAxmMenuHeuristic,
  validateStoryPlanAxmSelection,
  type SamStoryPlanAxmMenuPlanInputV1,
  type SamStoryPlanAxmMenuSelectionV1,
} from './story-plan/plan-axm-menu-heuristic.js';
export {
  planStoryCreateHeuristic,
  type SamStoryPlanHeuristicSelectionV1,
} from './story-plan/plan-catalog-heuristic.js';
export {
  resolveStoryPlanStoreForPlan,
  resolveStoryPlanStoreFromHints,
  shouldRandomizeStoryPlanStore,
} from './story-plan/resolve-story-plan-store.js';
export {
  buildSamStoryPlanCatalogSnapshot,
  buildSamStoryPlanChecklist,
  buildSamStoryPlanExtractionIndex,
  mergeSamStoryPlanInput,
} from './story-plan/plan-corpus.js';
export {
  buildSamStoryPlanNarrativeContext,
  formatSamStoryPlanLlmUserPrompt,
} from './story-plan/narrative.js';
export {
  composeSamStoryPlanWorkingScenario,
  isThinSamStoryPlanScenario,
} from './story-plan/scenario.js';
export {
  intentIdsForSamStoryPlanningSegment,
  readSamStoryPlanSegmentNeedsSummary,
  readSamStoryPlanSegmentTopic,
  resolveSamStoryPlanningPrimaryFocusArea,
} from './story-plan/segment-psychology.js';
export type {
  SamStoryPlanCatalogBuildInputV1,
  SamStoryPlanChecklistItemV1,
  SamStoryPlanExtractedHintsV1,
  SamStoryPlanExtractionIndexV1,
  SamStoryPlanInputV1,
  SamStoryPlanNarrativeBuildInputV1,
  SamStoryPlanNarrativeContextV1,
  SamStoryPlanScenarioHintsV1,
  SamStoryPlanningSegmentProfileV1,
} from './types/story-plan.js';
export type { JourneyPaceId, PlanningSegmentJourneyPaceSource } from './story-plan/journey-pace.js';
export {
  JOURNEY_PACE_IDS,
  normalizeJourneyPaceId,
  resolvePersonaJourneyPace,
  resolvePlanningSegmentJourneyPace,
  resolveSegmentJourneyPaceFromPersonas,
} from './story-plan/journey-pace.js';
