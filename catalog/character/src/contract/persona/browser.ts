/**
 * Browser-safe Character surface — no disk `loadCharacter` or catalog file I/O.
 * @packageDocumentation
 */

export type { Character, CharacterDocument } from './types/character.js';
export {
  CHARACTER_SPEC_VERSION,
  assertSupportedCharacterSpec,
  characterSpecVersion,
  type CharacterSpecVersion,
} from './types/character-spec.js';
export { CHARACTER_PACKAGE } from './contract/character-package-meta.js';
export type { CharacterPersona } from './types/character-persona.js';
export type {
  CharacterAudienceAspectRef,
  CharacterAudienceAspectSource,
} from './types/audience/audience-aspect-ref.js';
export type { CharacterAudiencePlane } from './types/audience/character-audience-plane.js';
export {
  CharacterAudienceAspectRefSchema,
  CharacterAudiencePlaneSchema,
} from './schemas/audience/character-audience-plane.schema.js';
export { normalizeCharacterAudiencePlane } from './audience/normalize-audience-plane-weights.js';
export type { Persona } from './types/strategy/persona.js';
export type {
  CharacterPersonality,
  CharacterPersonalityDelivery,
} from './types/character-persona.js';
export {
  CharacterPersonalitySchema,
  CharacterPersonalityDeliverySchema,
} from './schemas/character-persona.schema.js';
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

export { characterToContribution, type CharacterAxmContribution } from './contract/to-contribution.js';
export { characterToJSON, characterFromJSON, type CharacterJson } from './contract/json.js';
export { CharacterBundle } from './contract/character-document.js';
export type { TwinfileLoroMap } from '@doppler-group/twinfile-core/loro';
export { validateCharacter, type ValidateCharacterResult } from './contract/validate-character.js';
export { parseCharacter, CharacterSchema } from './schemas/character.schema.js';
export type {
  CharacterInstanceCharacteristics,
  CharacterStoryInstance,
} from './types/story/character-story-instance.js';
export type { CharacterInstanceVariationPolicy } from './types/story/character-instance-variation.js';
export { CharacterStoryInstanceDocument } from './story/character-story-instance-document.js';
export {
  DEFAULT_CHARACTER_INSTANCE_TRAIT_PICK_COUNT,
  DEFAULT_CHARACTER_INSTANCE_VARIATION,
} from './types/story/character-instance-variation.js';
export {
  materializeCharacterStoryInstance,
  pickCharacterInstanceCharacteristics,
  demographicPlaneFromCharacterSignals,
  resolveCharacterDemographicPlane,
  sampleDemographicBandsFromPlane,
  sampleCharacterDemographicBands,
  type MaterializeCharacterStoryInstanceInput,
} from './story/materialize-character-story-instance.js';
export {
  createCharacterInstanceChance,
  characterInstanceRandomFromChance,
  resolveCharacterInstanceRandom,
  type CharacterInstanceRandomSource,
} from './story/character-instance-rng.js';
export type { SignalDimension } from './types/story/signal-dimension.js';
export { SignalDimensionSchema } from './schemas/story/signal-dimension.schema.js';
export {
  hydrateCharacterSignalsFromDimensions,
  researchSignalsFromDimensionsAndValues,
} from './story/hydrate-character-signals-from-dimensions.js';
export type { ResearchSignal } from './types/story/research-signal.js';
export {
  psychologyFromCharacterStoryInstance,
  type CharacterStoryPsychology,
} from './story/character-story-psychology.js';
export {
  templateReplyFromCharacterAtBeat,
  type CharacterStoryBeatContext,
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
  segmentIdFromCharacterPersonaSegment,
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
