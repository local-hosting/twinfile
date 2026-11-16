/**
 * @doppler-group/twinfile-character/pcm — Persona Character Model (one portable character).
 *
 * @packageDocumentation
 */

export * from './browser.js';

export { pcmCatalogId, pcmCatalogLabel, pcmCatalogSegment } from './contract/pcm-catalog-display.js';

export {
  ProductObjectiveSchema,
  parseProductObjective,
} from './schemas/strategy/strategy.schema.js';
export type {
  ProductObjective,
  ProductObjectiveKeyResult,
  StrategyEntityLifecycle,
} from './types/strategy/strategy.js';

/** @deprecated Import from `@doppler-group/twinfile-character/jsm`. */
export { JobSchema, parseJob } from '../situations/index.js';

export {
  ObstacleSchema,
  JourneyObstacleEncounterSchema,
} from './schemas/story/obstacle.schema.js';

export { pcmToContribution, type PcmAxmContribution } from './contract/to-contribution.js';
export { loadPCM, type LoadPCMResult } from './contract/load-pcm.js';
export { savePCM } from './contract/save-pcm.js';
export {
  PCM_MENTAL_MODEL_SCOPE_FILE,
  PCM_OBJECTIVES_FILE,
  PCM_SEGMENT_FACET_FILES,
} from './contract/pcm-segment-topics.js';
export type { PcmSegmentFacets, PcmSegmentStrategy } from './types/pcm-segment-facets.js';
export type { PCMEmpathy, PCMExemplar } from './types/pcm-character.js';

export {
  demographicProfileFromPcm,
  personaProfileFromPcm,
  psychographicSegmentProfileFromPcm,
} from './people/customer/profile/profiles-from-pcm.js';
export {
  segmentAttitudesFromSignalValues,
  type SegmentAttitudesBody,
} from './people/customer/profile/segment-attitudes-from-signals.js';

export { normalizeAXMIdentityInput, normalizeTouchpointInput } from './axm/normalize-identity-input.js';
export { mergeHostContexts, normalizeHostContext } from './axm/normalize-host.js';
export { PERSONA_DAILY_BLOCK_IDS } from './types/strategy/persona-daily-rhythm.js';
export {
  CREATIVE_LATE_WEEKDAY_DAILY_RHYTHM,
  DRIVER_WEEKDAY_DAILY_RHYTHM,
  URBAN_COMMUTER_WEEKDAY_DAILY_RHYTHM,
} from './persona/persona-daily-rhythm-presets.js';
export { resolvePersonaDailyRhythm } from './persona/resolve-persona-daily-rhythm.js';
export { resolvePcmPersonaDisplayName } from './persona/resolve-persona-display-name.js';
export { pickPersonaDailyRhythmTemplate } from './persona/pick-persona-daily-rhythm-template.js';
export { adjustDailyRhythmForInstance } from './persona/adjust-daily-rhythm-for-instance.js';
export {
  findDailyRhythmBlock,
  formatDailyRhythmClock,
  samplePersonaDailyRhythm,
} from './persona/sample-persona-daily-rhythm.js';
export {
  allocateUniquePersonaId,
  buildPersonaIdSlug,
  slugifyPersonaToken,
} from './persona/persona-instance-id.js';

export {
  parsePsychographicAspectRef,
  parsePsychographic,
  resolvePsychographic,
} from './psychographic/resolve-psychographic.js';

export * from './pcm-audience.js';
export * from './journey/index.js';
export { JourneyEmotionValenceSchema, type JourneyEmotionValence } from './browser.js';
export * from './people/customer/customer.js';
export * from './people/customer/index.js';
export * from './people/audience/index.js';
export * from './people/visitors/index.js';
export * from './empathy/think/index.js';
export * from './empathy/feel/index.js';
export * from './empathy/see/index.js';
export * from './empathy/hear/index.js';