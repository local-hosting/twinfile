/**
 * Browser-safe PCM surface — no disk `loadPCM` or catalog file I/O.
 * @packageDocumentation
 */

export type { PCM, PCMDocument } from './types/pcm.js';
export {
  PCM_SPEC_VERSION,
  assertSupportedPCMSpec,
  pcmSpecVersion,
  type PCMSpecVersion,
} from './types/pcm-spec.js';
export { PCM_PACKAGE } from './contract/pcm-package-meta.js';
export type { PCMCharacter } from './types/pcm-character.js';
export type {
  PcmAudienceAspectRef,
  PcmAudienceAspectSource,
} from './types/audience/audience-aspect-ref.js';
export type { PcmAudiencePlane } from './types/audience/pcm-audience-plane.js';
export {
  PcmAudienceAspectRefSchema,
  PcmAudiencePlaneSchema,
} from './schemas/audience/pcm-audience-plane.schema.js';
export { normalizePcmAudiencePlane } from './audience/normalize-audience-plane-weights.js';
export type { Persona } from './types/strategy/persona.js';
export { stripPersonaGroupFields } from './contract/strip-group-fields.js';
export type { Job } from '../situations/index.js';
export type {
  HeartDimension,
  HeartImpact,
  JourneyHeartPoint,
  JourneyHeartTrend,
} from './types/story/heart.js';
export type {
  JourneyObstacleEncounter,
  JourneyObstacleOutcome,
  Obstacle,
} from './types/story/obstacle.js';
export type {
  Journey,
  JourneyEmotionBand,
  JourneyEmotionValence,
  JourneyEmotions,
  JourneyMoment,
  JourneyNarrativeArc,
  JourneyNarrativeArcBeat,
  JourneyPhase,
  JourneyRelationshipEdge,
  JourneyTouchpointRef,
} from './types/story/journey.js';
export {
  JourneyEmotionBandSchema,
  JourneyEmotionValenceSchema,
  JourneyEmotionsSchema,
  JourneyMomentSchema,
  JourneyNarrativeArcBeatSchema,
  JourneyNarrativeArcSchema,
  JourneyPhaseSchema,
  JourneySchema,
  JourneyTouchpointRefSchema,
  parseJourney,
} from './schemas/story/journey.schema.js';
export { buildJourneyRelationshipEdges } from './domain/journey/graph-edges.js';
export { coalesceJourneyEmotions, normalizeJourneyPhase } from './domain/journey/normalize.js';
export {
  HEART_MAINTAINED_HIGH,
  journeyHeartSeries,
  journeyHeartTrends,
  obstacleEncounterImpacts,
  phaseObstacleEncounters,
} from './domain/journey/heart-series.js';
export { extractJourneyTouchpointSequence } from './journey/extract-touchpoint-sequence.js';
export {
  listJourneysForPersona,
  requireJourneyById,
  resolveJourneyById,
  resolveJourneyForPersona,
} from './journey/resolve-journey.js';

export { pcmToContribution, type PcmAxmContribution } from './contract/to-contribution.js';
export { pcmToJSON, pcmFromJSON, type PcmJson } from './contract/json.js';
export { PcmDocument } from './contract/pcm-document.js';
export { validatePCM, type ValidatePCMResult } from './contract/validate-pcm.js';
export { parsePCM, PCMSchema } from './schemas/pcm.schema.js';
export type {
  PcmInstanceCharacteristics,
  PcmStoryInstance,
} from './types/story/pcm-story-instance.js';
export type { PcmInstanceVariationPolicy } from './types/story/pcm-instance-variation.js';
export { PcmStoryInstanceDocument } from './story/pcm-story-instance-document.js';
export {
  DEFAULT_PCM_INSTANCE_TRAIT_PICK_COUNT,
  DEFAULT_PCM_INSTANCE_VARIATION,
} from './types/story/pcm-instance-variation.js';
export {
  materializePcmStoryInstance,
  pickPcmInstanceCharacteristics,
  demographicPlaneFromPcmSignals,
  resolvePcmDemographicPlane,
  sampleDemographicBandsFromPlane,
  samplePcmDemographicBands,
  type MaterializePcmStoryInstanceInput,
} from './story/materialize-pcm-story-instance.js';
export {
  createPcmInstanceChance,
  pcmInstanceRandomFromChance,
  resolvePcmInstanceRandom,
  type PcmInstanceRandomSource,
} from './story/pcm-instance-rng.js';
export type { SignalDimension } from './types/story/signal-dimension.js';
export { SignalDimensionSchema } from './schemas/story/signal-dimension.schema.js';
export {
  hydratePcmSignalsFromDimensions,
  researchSignalsFromDimensionsAndValues,
} from './story/hydrate-pcm-signals-from-dimensions.js';
export type { ResearchSignal } from './types/story/research-signal.js';
export {
  psychologyFromPcmStoryInstance,
  type PcmStoryPsychology,
} from './story/pcm-story-psychology.js';
export {
  templateReplyFromPcmAtBeat,
  type PcmStoryBeatContext,
} from './story/template-reply-at-beat.js';
export type { JourneyPaceId } from './types/story/journey-pace.js';
export { JOURNEY_PACE_IDS } from './types/story/journey-pace.js';
export {
  normalizeJourneyPaceId,
  resolvePersonaJourneyPace,
  resolvePlanningSegmentJourneyPace,
  resolveSegmentJourneyPaceFromPersonas,
  type PlanningSegmentJourneyPaceSource,
} from './story/resolve-journey-pace.js';
export {
  segmentIdFromPersonaSegment,
  segmentIdFromPcmPersonaSegment,
} from './persona/segment-id-from-persona.js';

export * from './myers-briggs/myers-briggs.schema.js';
export {
  PsychographicFrameworkIdSchema,
  PsychographicAspectRefSchema,
  PsychographicSchema,
  type PsychographicFrameworkId,
  type PsychographicAspectRef,
  type Psychographic,
} from './psychographic/legacy-resolved.schema.js';
export {
  DemographicSourceSchema,
  DemographicProfileSchema,
  DemographicCohortSchema,
  DemographicCatalogSchema,
  type DemographicSource,
  type DemographicProfile,
  type DemographicCohort,
  type DemographicCatalog,
} from './demographic/demographic.schema.js';
export { parseDemographicCatalog } from './demographic/demographic.js';
export * from './demographic/demographic-bands.js';
export {
  validateDemographicCatalogRelationships,
  type DemographicRelationshipIssue,
} from './demographic/validate-demographic-catalog-relationships.js';
