/**
 * @doppler-group/twinfile-story/narrative — Story Arc Model (one portable episode plan).
 *
 * @packageDocumentation
 */

export type { Story, StoryBinding, StoryDocument as StoryHeader } from './types/story-narrative.js';
export type { StoryCharacterRef, StoryPlaceRef } from './types/story-refs.js';
export type { DramaticBeatId } from './types/dramatic-beat.js';
export { DRAMATIC_BEAT_IDS } from './types/dramatic-beat.js';
export type {
  SamCatalogCharacterRef,
  SamCatalogEpisodeRef,
  SamCatalogPlaceRef,
  StoryCatalogMenuV1,
  StorySelectionV1,
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
  STORY_NARRATIVE_SPEC_VERSION,
  assertSupportedStoryNarrativeSpec,
  storyNarrativeSpecVersion,
  type StoryNarrativeSpecVersion,
} from './types/story-narrative-spec.js';
export { STORY_NARRATIVE_PACKAGE } from './contract/story-package-meta.js';
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
  assembleCharacterStoryRun,
  resolveDayActivitiesFromTimelineWire,
  type AssembledCharacterStoryRun,
} from './story/assemble-story-run.js';
export {
  planStoryEpisodeCalendar,
  type PlanStoryEpisodeCalendarInput,
  type PlanStoryEpisodeCalendarResult,
} from './story/plan-story-episode-calendar.js';
export {
  planEpisodeCalendarFromArc,
  type PlanEpisodeCalendarResult,
} from './story/plan-episode-calendar.js';
export {
  compileStoryEpisodeFromMounts,
  type CompileStoryEpisodeFromMountsInput,
  type CompileStoryEpisodeFromMountsResult,
} from './story/compile-story-episode-from-mounts.js';
export {
  assembleBelievableEpisodeFromCharacter,
  type AssembleBelievableEpisodeFromCharacterInput,
  type AssembleBelievableEpisodeFromCharacterResult,
  type BelievableEpisodeAssemblyV1,
} from './story/assemble-believable-episode-from-character.js';
export { resolveStoryEpisodeForCharacter } from './story-catalog/resolve-story-episode-for-character.js';
export { resolveStoryBeatSceneJobIds } from './story/resolve-beat-scene-job-ids.js';
export {
  assertStorySceneSeekDirection,
  dayIndexForSceneOnHorizon,
  resolveStorySceneSeekTarget,
  seekStoryEpisodeSceneOnArc,
  storySceneSeekRowsFromSam,
  type SeekStoryEpisodeSceneCoreResult,
  type SeekStoryEpisodeSceneInput,
  type StorySceneSeekDirection,
  type StorySceneSeekRow,
} from './story/seek-story-episode-scene.js';
export {
  touchpointSequenceFromEpisodeArc,
  touchpointSequenceFromStoryArc,
} from './episode/touchpoint-sequence-from-episode-arc.js';
export type {
  StoryTimelineActivityWire,
  StoryTimelineDayWire,
  StoryTimelineHostWire,
} from './story/timeline-host-wire.js';
export type { CharacterStoryRunState } from './types/story-run.js';
export type {
  EpisodeActivityCalendar,
  EpisodeActivityDay,
  EpisodeActivityKind,
  EpisodeScheduledActivity,
} from './types/episode-activity.js';
export type { StoryCharacterContext } from './types/story-character-context.js';
export type { StoryPlaceMount, PlaceMount, TwinfilePlaceMount } from './types/place-mount.js';
export {
  findScenePlaceRefsOutsidePlaceMounts,
  placeMountByPlaceRef,
  resolveSceneSpaceId,
} from './place/place-mount-catalog.js';
export {
  mergePlaceMountsByPlaceRef,
  minimalPlaceMount,
  minimalPlaceMountFromGeoAnchor,
  type MinimalPlaceMountInput,
} from './place/minimal-place-mount.js';
export { placeMountFromHostUnit } from './place/place-mount-from-host-unit.js';
export { placeMountFromPlaceRef } from './place/place-mount-from-place-ref.js';
export { placeMountFromJson, placeMountToJson } from './place/place-mount-json.js';
export {
  distanceKmBetween,
  rankPlaceMountsNearAnchor,
  type GeoAnchorV1,
  type RankedPlaceMountNearAnchorV1,
} from './place/rank-places-near-anchor.js';
export {
  extractSceneTouchpointRows,
  type SceneTouchpointRow,
} from './scene/extract-scene-touchpoint-rows.js';
export {
  resolveJourneyFromCharacterContext,
  resolveCharacterForContext,
} from './contract/resolve-character-context.js';
export {
  buildEpisodeTouchpointScheduleFromSceneRows,
} from './episode/materialize-episode-arc.js';
export type {
  StoryTouchpointCatalog,
  StoryTouchpointDefinition,
  StoryTouchpointLink,
  StoryTouchpointLocus,
  TouchpointGraphWire,
} from './types/touchpoint-catalog.js';
export {
  resolveTouchpointLabel,
  touchpointCatalogFromWire,
  touchpointIndexFromCatalog,
} from './touchpoint/touchpoint-catalog.js';
export {
  touchpointGraphToStoryWire,
  type TouchpointGraphWireInput,
} from './touchpoint/touchpoint-graph-to-wire.js';
export {
  listSceneTouchpointRefs,
  resolveTouchpointDefinition,
  resolveTouchpointPlaceAtScene,
  touchpointRequiresPlace,
} from './touchpoint/resolve-touchpoint-place.js';
export type { StorySceneTouchpointRef, SceneCharacterBeat } from './types/scene.js';
export { hydrateSceneFromJourney, hydrateScenesFromJourney } from './scene/hydrate-scene-from-journey.js';
export type { EpisodeCalendarResources } from './types/episode-calendar-generator.js';

export { loadStory, type LoadStoryResult } from './contract/load-story.js';
export {
  validateStoryNarrative,
  validateStoryNarrativeAssociations,
  type ValidateStoryResult,
  type ValidateStoryContext,
  type ValidateStoryAssociationsResult,
} from './contract/validate-story-narrative.js';
export { storyToJSON, storyFromJSON, type StoryJson } from './contract/json.js';
export { StoryDocument } from './contract/story-document.js';
export type { TwinfileLoroMap } from '@doppler-group/twinfile-core/loro';
export {
  StoryInstanceDocument,
  storyCharacteristicsFromJSON,
  type StoryInstanceJson,
  type StoryRuntimeWire,
  type StoryCharacteristics,
} from './story/story-instance-document.js';
export {
  resolveStoryNarrativeInstance,
  type ResolveStoryNarrativeInstanceInput,
  type ResolveStoryNarrativeInstanceResult,
} from './story/resolve-story-narrative-instance.js';
export {
  buildCharacterStoryRun,
  type BuildCharacterStoryRunInput,
  type CharacterStoryRun,
} from './story/character-story-run.js';
export {
  advanceStoryEpisode,
  type AdvanceStoryEpisodeInput,
  type AdvanceStoryEpisodeResult,
  type AdvanceStoryEpisodeTarget,
} from './story/advance-story-episode.js';
export {
  seekStoryScene,
  type SeekStorySceneInput,
  type SeekStorySceneResult,
} from './story/seek-story-scene.js';
export {
  runStoryCharacterChat,
  type StoryCharacterLlmInterpreter,
  type StoryCharacterChatResult,
} from './story/run-story-character-chat.js';
export { parseStory, StoryNarrativeSchema } from './schemas/story-narrative.schema.js';
export {
  EpisodeArcV1Schema,
  EpisodePhaseIdSchema,
  EpisodeTouchpointScheduleEntrySchema,
} from './schemas/episode-arc.schema.js';
export {
  parseStoryDimensions,
  StoryDimensionHowSchema,
  StoryDimensionWhatSchema,
  StoryDimensionWhenSchema,
  StoryDimensionWhereSchema,
  StoryDimensionWhoSchema,
  StoryDimensionWhySchema,
  StoryDimensionsSchema,
} from './schemas/story-dimensions.schema.js';
export { compileStory, type CompileStoryInput, type CompileStoryResult } from './contract/compile-story-narrative.js';

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
export { validateStoryNarrativeScenes, type ValidateStoryScenesResult } from './contract/validate-story-scenes.js';
export {
  validateStoryNarrativeCoherence,
  type ValidateStoryNarrativeCoherenceResult,
} from './contract/validate-story-narrative-coherence.js';
export { validateStoryNarrativeStoryArc, type ValidateStoryStoryArcResult } from './contract/validate-story-story-arc.js';

export type {
  StoryJourney,
  StoryJourneyContext,
  StoryJourneyJob,
  StoryJourneyPhase,
  StoryJourneyTouchpoint,
} from './types/story-narrative-journey.js';
export { resolveJourneyForStory } from './journey/build/resolve-journey-for-story.js';
export {
  buildStoryCatalogMenu,
  buildUserStoryCatalogMenu,
  storyCatalogMenuHasEpisodes,
} from './story-catalog/build-story-catalog-menu.js';
export {
  matchStoryCatalogIdsFromText,
  scoreCatalogTextMatch,
  placeSlugFromPlaceRef,
  type StoryCatalogFleetPlaceRef,
  type StoryCatalogTextMatchV1,
} from './story-catalog/match-story-catalog-from-text.js';
export type {
  StoryPlanCatalogSnapshotV1,
  StoryPlanFleetPlaceSnapshotV1,
  StoryPlanSegmentObjectiveV1,
  StoryPlanSegmentSnapshotV1,
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
  scoreFleetPlaceScenarioMatch,
  scoreScenarioTokenOverlap,
} from './story-plan/scenario-scoring.js';
export {
  planStoryCreateCatalogMenuHeuristic,
  validateStoryPlanCatalogMenuSelection,
  type StoryPlanCatalogMenuPlanInputV1,
  type StoryPlanCatalogMenuSelectionV1,
} from './story-plan/plan-catalog-menu-heuristic.js';
export {
  planStoryCreateHeuristic,
  type StoryPlanHeuristicSelectionV1,
} from './story-plan/plan-catalog-heuristic.js';
export {
  resolveStoryPlanStoreForPlan,
  resolveStoryPlanStoreFromHints,
  shouldRandomizeStoryPlanStore,
} from './story-plan/resolve-story-plan-store.js';
export {
  buildStoryPlanCatalogSnapshot,
  buildStoryPlanChecklist,
  buildStoryPlanExtractionIndex,
  mergeStoryPlanInput,
} from './story-plan/plan-corpus.js';
export {
  buildStoryPlanNarrativeContext,
  formatStoryPlanLlmUserPrompt,
} from './story-plan/narrative.js';
export {
  composeStoryPlanWorkingScenario,
  isThinStoryPlanScenario,
} from './story-plan/scenario.js';
export {
  intentIdsForStoryPlanningSegment,
  readStoryPlanSegmentNeedsSummary,
  readStoryPlanSegmentTopic,
  resolveStoryPlanningPrimaryFocusArea,
} from './story-plan/segment-psychology.js';
export {
  buildStoryPlanningCatalogsFromCharacters,
  listStoryJourneyRefsFromPlanningCatalogs,
} from './story-plan/build-story-planning-catalogs-from-characters.js';
export {
  focalCharacterIdFromStoryMenuEpisode,
  personaMountIdFromStoryMenuEpisode,
  focalCharacterFromStoryEpisodeMount,
  storyPlanJourneyRowsFromMenuEpisodes,
  matchStoryCatalogIdsFromTextForPlanning,
  matchStoryCatalogIdsFromTextForFieldwise,
  storyWireFocalCharacterArg,
  storyWireFocalCharacterField,
  storyMenuEpisodeRefForTest,
  type StoryMenuEpisodeWire,
  type StoryPlanJourneyRowWire,
} from './story-plan/story-catalog-menu-wire.js';
export type {
  StoryJourneyRefV1,
  StoryPlanningCatalogsFromCharactersV1,
  StoryPlanningCustomerCatalogV1,
  StoryPlanningJtbdCatalogV1,
  StoryPlanningObstacleCatalogV1,
  StoryPlanningPersonaCatalogV1,
  StoryPlanningSegmentCatalogV1,
} from './types/story-planning-catalog-slices.js';
export type {
  StoryPlanCatalogBuildInputV1,
  StoryPlanChecklistItemV1,
  StoryPlanExtractedHintsV1,
  StoryPlanExtractionIndexV1,
  StoryPlanExtractionSegmentBriefV1,
  StoryPlanInputV1,
  StoryPlanNarrativeBuildInputV1,
  StoryPlanNarrativeContextV1,
  StoryPlanScenarioHintsV1,
  StoryPlanSegmentNarrativeV1,
  StoryPlanningFocusInterestV1,
  StoryPlanningSegmentObjectiveV1,
  StoryPlanningSegmentProfileV1,
} from './types/story-plan.js';
export type { JourneyPaceId, PlanningSegmentJourneyPaceSource } from './story-plan/journey-pace.js';
export {
  JOURNEY_PACE_IDS,
  normalizeJourneyPaceId,
  resolvePersonaJourneyPace,
  resolvePlanningSegmentJourneyPace,
  resolveSegmentJourneyPaceFromPersonas,
} from './story-plan/journey-pace.js';
export {
  buildCalendarDaysFromTimelineWire,
  type EpisodeCalendarDayEntry,
  type EpisodeCalendarDaysByIsoDate,
  type EpisodeCalendarDayScheduleActivity,
} from './story/build-calendar-days-from-timeline.js';
export {
  resolveStoryEpisode,
  type ResolveStoryEpisodeSelection,
  type StoryEpisodeMountV1,
} from './story-catalog/resolve-story-episode.js';
export { compileStoriesForCatalog } from './story-catalog/compile-stories-for-catalog.js';
export type {
  StoryDimensionsV1,
  StoryDimensionWhoV1,
  StoryDimensionWhatV1,
  StoryDimensionWhereV1,
  StoryDimensionWhenV1,
  StoryDimensionWhyV1,
  StoryDimensionHowV1,
} from './types/story-dimensions.js';
export type {
  HostEngagementLevelId,
  HostStoryCreateDimensionsV1,
  HostStoryDimensionHowV1,
  HostStoryDimensionWhatV1,
  HostStoryDimensionWhenV1,
  HostStoryDimensionWhereV1,
  HostStoryDimensionWhoV1,
  HostStoryDimensionWhyV1,
} from './types/host-story-dimensions.js';
export {
  projectStoryDimensionsFromStory,
  type ProjectStoryDimensionsFromStoryInput,
} from './project/project-story-dimensions-from-story.js';
export {
  attachPlaceSlugFromPlaceRef,
  HOST_STORY_WHERE_DIMENSION_ERROR,
  hostStoryWhereDimensionIsComplete,
  mergeStoryDimensionsIntoCreateBody,
  mergeStoryDimensionsWithHost,
  type HostStoryWhereDimensionInput,
} from './project/merge-story-dimensions-with-host.js';
export { buildJourney, buildJourneyFromBinding } from './journey/build/build-journey.js';
export { formatJourneyMarkdown } from './journey/build/format-journey-markdown.js';
export { journeyFileBasename } from './journey/build/journey-file-basename.js';
export {
  briefSection,
  buildAxmSegmentBrief,
  buildCharacterBrief,
  buildFeedBrief,
  buildFleetBrief,
  buildDirectorScriptScenes,
  buildStoryboardSceneContext,
  buildStoryBrief,
  formatStoryDirectorNarrative,
  formatBriefMarkdown,
  humanizeStoryWireLabel,
  serializeStoryboardLlmContext,
  joinBriefSections,
  type AxmSegmentBriefRowV1,
  type BriefSectionV1,
  type BuildFleetBriefInput,
  type FeedBriefRow,
  type BriefV1,
  type FleetBriefMember,
  type StoryBriefCharacterV1,
  type DirectorScriptSceneV1,
  type FormatStoryDirectorNarrativeInput,
  type StoryboardPanelV1,
  type StoryboardSceneContextV1,
  type StoryBriefSnapshotV1,
  mergeJobSituationModels,
  resolveStoryEpisodePresentation,
  buildStorySituationsNarrativeContext,
  isTechnicalStoryIdentityLabel,
  type StoryEpisodePresentationV1,
  type StorySituationsNarrativeContextV1,
} from './brief/index.js';
