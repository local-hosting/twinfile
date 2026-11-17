/** Psychographic typing owned by `@doppler-group/twinfile-character/character` — re-exported for bundle / user-aspect compatibility. */
export {
  MBTI_TYPE_IDS,
  MbtiDimensionDefinitionSchema,
  MbtiDimensionIdSchema,
  MbtiDimensionsSchema,
  MbtiPoleIdSchema,
  MbtiTypeDefinitionSchema,
  MbtiTypeIdSchema,
  MyersBriggsCatalogSchema,
  type MbtiDimensionDefinition,
  type MbtiDimensionId,
  type MbtiDimensions,
  type MbtiPoleId,
  type MbtiTypeDefinition,
  type MbtiTypeId,
  type MyersBriggsCatalog,
} from './myers-briggs/myers-briggs.schema.js';
export {
  clearMyersBriggsCatalogCache,
  loadMyersBriggsCatalog,
} from './myers-briggs/load-myers-briggs-catalog.js';
export {
  findMbtiTypeDefinition,
  getDefaultMyersBriggsCatalog,
  mbtiDimensionsFromTypeId,
  parseMbtiTypeId,
  resolveMbtiTypeDefinition,
} from './myers-briggs/myers-briggs.js';
export {
  PsychographicAspectRefSchema,
  PsychographicFrameworkIdSchema,
  PsychographicSchema,
  type Psychographic,
  type PsychographicAspectRef,
  type PsychographicFrameworkId,
} from './psychographic/legacy-resolved.schema.js';
export {
  parsePsychographic,
  parsePsychographicAspectRef,
  resolvePsychographic,
} from './psychographic/resolve-psychographic.js';
