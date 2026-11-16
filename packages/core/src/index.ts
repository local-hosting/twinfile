/**
 * @doppler-group/twinfile-core — reference build (merge, contract, digests).
 *
 * @packageDocumentation
 */

export { CORE_PACKAGE } from './core/core-package-meta.js';
export {
  TWINFILE_FORMAT_VERSION,
  CORE_SPEC_PIN,
  assertSupportedTwinfileVersion,
  TWINFILE_SUMMARY_LAYOUT_ID,
  TWINFILE_USE_MODES,
  TWINFILE_USE_MODE_TITLES,
  type TwinfileFormatVersion,
} from './types/twinfile-spec.js';
export {
  TWINFILE_REF_PATTERN,
  isTwinfileRef,
  parseTwinfileRef,
  placeRefForName,
  placeRefIdentity,
  samePlaceRef,
  type TwinfileRef,
} from './types/twinfile-ref.js';

export { mergeObjects, canonicalizeJson, type IdRecord, type MergeOptions } from './build/merge.js';
export { sha256Digest, layerChainDigest, placeImageDigest } from './build/digest.js';
export { digestFileBytes, digestBuffer } from './build/digest-file.js';
export {
  ContractChecker,
  type ContractError,
  type ContractErrorCode,
} from './build/contract-checker.js';
export { addAssetsLayerToPlace } from './cli/add-assets-layer.js';
export { formatBuildLayerScope, formatBuildLayerStepLabel } from './build/build-layer-label.js';
export {
  listTwinfileManifestRecipe,
  type TwinfileManifestBuildStep,
  type TwinfileManifestRecipe,
} from './build/build-layer-manifest.js';
export {
  buildLayerDisplayLabel,
  summarizeBuildLayerRows,
  type BuildLayerRowLike,
} from './build/build-layer-display.js';
export { suggestedLayerHints, VISITS_LAYER_HINT } from './cli/suggested-layer-hints.js';
export {
  readTwinfileLock,
  writeTwinfileLock,
  verifyLockEntry,
  mergeLockEntry,
  lockRefKeyFromTwinfile,
} from './lock/twinfile-lock.js';
export type { TwinfileLockDocument } from './types/twinfile-lock.js';
export { packTwinfileOci, digestTwinfileTree, ociConfigFromTwinfile } from './pack/oci-pack.js';
export { pushTwinfileToRegistry, defaultPushRef, type OciPushOptions, type OciPushResult } from './pack/oci-push.js';
export { pullTwinfileFromRegistry, type OciPullOptions, type OciPullResult } from './pack/oci-pull.js';
export { buildTwinfileOciDistribution } from './pack/oci-distribution.js';
export { RefResolver, type ResolvedRef } from './ref/ref-resolver.js';
export {
  resolveTwinfileByRef,
  loadTwinfileAtPath,
  resolveRelativeTwinfilePath,
  type TwinfileResolveOptions,
  type ResolvedTwinfileRef,
} from './ref/twinfile-resolver.js';
export { LayerCache } from './cache/layer-cache.js';
export { lintDtprDisclosures, type DtprLintIssue } from './dtpr/lint-disclosures.js';
export {
  DEFAULT_DTPR_SCHEMA_VERSION,
  dtprApiBaseUrl,
  dtprElementIconUrl,
  elementLabelsForInlineDtpr,
  fetchDtprElementLabels,
  fetchDtprLabelsForDisclosures,
  flattenInlineElementIds,
  humanizeDtprElementId,
  resolveDtprSchemaVersion,
} from './dtpr/dtpr-public-api.js';
export { listDtprDisclosures, type DtprDisclosureRow } from './dtpr/list-disclosures.js';
export {
  isExamplesCatalogRoot,
  listFlatExampleUnitNames,
} from './paths/examples-catalog.js';
export { resolveExamplesRoot } from './paths/resolve-examples-root.js';
export { resolveTwinfileAnchor } from './paths/resolve-twinfile-anchor.js';
export {
  patchGraphBoundaryIo,
  patchModuleUseMode,
  patchModuleWireIo,
} from './patch/patch-card-io.js';
export { PLACE_TYPE_SCHEMA_ID, validatePlaceTypeValue } from './validate/validate-yaml.js';
export type {
  PlaceTypeV1,
  PlaceControlAcceptV1,
  PlaceDataPortV1,
  PlaceLogicalPortV1,
} from './types/place-type.js';
export { buildEventMessage } from './patch/build-event-message.js';
export { validateEventMessageTarget } from './patch/validate-event-message.js';
export { connectPorts, disconnectPort, patchCordId, tryConnectPorts } from './patch/processor-graph-edit.js';
export {
  ProcessorGraph,
  type ProcessorGraphStats,
} from './patch/processor-graph.js';
export { validateProcessorGraph } from './patch/processor-graph-validate.js';
export {
  PATCH_MODULE_TYPE_IDS,
  PATCH_WIRES,
  isPatchModuleTypeId,
  isPatchWire,
  type PatchModuleTypeId,
  type PatchWire,
} from './generated/patch-module-types-data.js';
export { buildProcessorsResourceFromGraph } from './patch/build-processors-resource.js';
export { PatchProgram, CurriedPatchProgram } from './patch/program/patch-program.js';
export { PatchContext } from './patch/program/patch-context.js';
export { PatchGraphModel } from './patch/program/patch-graph-model.js';
export { routeOneHop } from './patch/program/patch-router.js';
export { eventPulseHandler, type EventPulseHandlerOptions } from './patch/program/event-pulse.js';
export { SignalFeed, type SignalFeedInput } from './patch/program/signal-feed.js';
export type {
  BuildEventMessageInput,
  EventPulsePayload,
} from './types/event-pulse.js';
export type {
  ContextSlice,
  PatchProgramBuiltInput,
  PatchTrace,
  PatchTraceEntry,
} from './types/patch-program.js';
export { checkProcessorGraph } from './check/patch-graph.js';
export {
  TWINFILE_UNTITLED_DISPLAY,
  titleFromRefId,
  twinfileDisplayName,
  twinfileManifestKindLabel,
  twinfileRefId,
  twinfileRefLabel,
} from './twinfile/display-name.js';
export { formatTwinfileSummaryMarkdown } from './views/format-summary-markdown.js';
export { renderTwinfileSummaryAscii } from './views/render-summary-ascii.js';
export {
  renderTwinfileSummaryView,
  type TwinfileSummaryViewFormat,
  type RenderTwinfileSummaryViewOptions,
} from './views/render-summary-view.js';
export {
  renderTwinfilePlaceView,
  type TwinfilePlaceViewFormat,
} from './views/place-json-ld.js';
export {
  compactForLoroStorage,
  prepareTwinfileLoroValue,
  renderTwinfileLoroView,
  stripMethodFieldsForLoro,
  type TwinfileLoroViewFormat,
  type RenderTwinfileLoroViewOptions,
} from './views/loro-value.js';
export type {
  TwinfileSummaryV1,
  TwinfileSummaryHeader,
  TwinfileSummaryAspect,
  TwinfileSummaryIoPort,
  TwinfileSummaryBlock,
  TwinfileSummaryLayoutV1,
  TwinfileSummaryLayoutRow,
  TwinfileSummaryBase,
  TwinfileSummaryPlaceVisit,
  TwinfileUseMode,
  BuildTwinfileSummaryInput,
} from './types/twinfile-summary.js';
export { loadPatchModuleTypeCatalog } from './patch/module-type-catalog.js';
export { buildProcessorsResourceFromTwinfile } from './patch/build-processors-resource.js';
export type { BuildProcessorsResourceOptions } from './patch/build-processors-resource.js';
export {
  applyProcessorGraphToTwinfile,
  twinfileProcessorsFromGraph,
  removeTwinfileProcessor,
  setTwinfileProcessors,
  upsertTwinfileProcessor,
} from './patch/twinfile-processors-serde.js';
export { createPatchMessageBus, type PatchMessageBus, type PatchMessageHandler } from './patch/patch-message-bus.js';
export {
  PATCH_FLOW_COLLECTION_ID,
  pinPatchFlow,
  type PatchFlowHostPin,
} from './patch/patch-flow-host-pin.js';
export {
  buildProcessorTypeCatalogResource,
  TWINFILE_PROCESSOR_TYPES_RESOURCE_SCHEMA,
  type ProcessorTypeCatalogResourceV1,
} from './patch/processor-type-catalog-resource.js';
export { projectPatchGraphForUi } from './patch/project-patch-ui.js';
export { slicePlaceForMapSink, type MapSinkSliceOptions, type MapSinkWire } from './map/map-sink-adapter.js';
export {
  TWIN_MESSAGE_SCHEMA,
  type TwinMessagePortRef,
  type TwinMessageV1,
} from './types/twin-message.js';
export {
  TWINFILE_PATCH_UI_SCHEMA,
  type PatchUiModel,
  type PatchUiModule,
  type PatchUiPort,
  type PatchUiConnection,
} from './types/processor-ui.js';
export {
  TWINFILE_PROCESSORS_RESOURCE_SCHEMA,
  type ProcessorsResourceV1,
} from './types/processors-resource.js';
export type {
  PatchGraphV1,
  PatchModule,
  PatchConnection,
  PatchEndpoint,
  PatchModuleTypeCatalog,
  PatchPortDef,
} from './types/patch-graph.js';
export { queryPath, type PathQueryInput, type PathQueryResult, type PlacePath } from './query/path-query.js';
export {
  loadTwinLocalMap,
  mergeTwinLocalMaps,
  resolveTwinLocalPath,
} from './ref/twin-local-map.js';
export {
  resolveExamplePlace,
  resolvedExamplePlaceFromTwinfileDir,
  listExamplePlaceRefs,
} from './ref/resolve-example-place.js';
export {
  DEFAULT_PLACE_BASE_REFS,
  placeBaseRefForArchetype,
  isPlaceArchetype,
  type PlaceArchetype,
} from './ref/place-base-refs.js';
export type {
  ResolvedExamplePlace,
  ResolveExamplePlaceOptions,
} from './types/resolved-example-place.js';
export type {
  TwinfilePlaceMount,
  PlaceMount,
  ResolvePlaceMountOptions,
  PlaceMountLayoutLevel,
  PlaceMountLayoutSpace,
  PlaceMountLayoutPathway,
} from './types/twinfile-place-mount.js';
export { parseDurationToSeconds, resolveTimeArg } from './build/resolve-duration.js';
export { TwinfileDocument, type TwinfileHead } from './doc/twinfile-document.js';
export type { PlaceWireJson } from './doc/place-wire.js';

export type { GeotypeTwinfile } from './types/geotype-twinfile.js';
export { parseGeotypeTwinfile } from './types/geotype-twinfile.js';
export { checkGeotypeTwinfile } from './check/geotype-check.js';
export {
  buildPlaceJsonLd,
  buildPlaceJsonLdFromTwinfile,
  isPublishedPlaceTwinfile,
  type BuildPlaceJsonLdOptions,
  type PlaceJsonLdDocument,
} from './views/place-json-ld.js';
export type { TwinError, TwinErrorCode, Result } from './types/twin-error.js';
export { ok, err } from './types/twin-error.js';
export { isRecord } from './doc/is-record.js';
export type { BuildLayerKind, BuildLayerResult, ComposedBuildLayer } from './types/build-layer.js';
export type {
  TwinTypeModule,
  TwinKind,
  BuildOptions,
  AnyTwinTypeModule,
  TwinTypeRegistry,
} from './types/twin-type-module.js';
export type { TwinKind as TwinKindId } from './types/twin-kind.js';
export type { TwinHead, BuiltTwinHead, TwinHeadPath } from './types/twin-head.js';
export { TWIN_HEAD_SUFFIX } from './types/twin-kind.js';
export {
  parseTwinHead,
  findTwinHead,
  isTwinUnitDir,
  type ParseTwinHeadOptions,
} from './twinfile/twin-head.js';
export { createHeadTwinTypeModule, type HeadTwinTypeModuleOptions } from './twinfile/twin-type-module.js';
export { createTwinTypeRegistry } from './twinfile/twin-type-registry.js';
export {
  TWIN_CATALOG_HUB,
  TWIN_CATALOG_TYPES,
  catalogCharacterLibsDir,
  catalogHubDir,
  catalogTypeDir,
  catalogTypeExamplesDir,
  isTwinfileMonorepoRoot,
  resolveCharacterCatalogRoot,
  resolvePlaceExamplesCatalogRoot,
  resolveTwinfileRoot,
  resolveTypeExamplesRoot,
  type TwinCatalogType,
} from './paths/catalog-layout.js';
export {
  GOLDEN_SCENE_RUN_STORIES,
  goldenSceneRunRelPath,
  resolveGoldenSceneRun,
} from './paths/golden-scene-runs.js';
export {
  loadProjectTwinManifest,
  listExampleUnitIds,
  exportProjectTwinBundle,
  type ProjectTwinManifest,
  type ProjectTwinBundle,
} from './project/export-project-twin.js';
export {
  emptyCanvasProjectExport,
  canvasEntitiesFromProjectBundle,
  type CanvasProjectExport,
} from './canvas/export-project-entities.js';
export {
  loadCanvasDemoChrome,
  loadCanvasDemoPack,
  resolveCanvasDemoPackPath,
  writeCanvasDemoChromeJson,
} from './canvas/load-canvas-demo-chrome.js';
export type {
  CanvasDemoCharacterRow,
  CanvasDemoEventRow,
  CanvasDemoPackManifest,
  CanvasDemoPlaceRow,
  CanvasDemoProjectContent,
  CanvasDemoResourceRow,
  CanvasDemoStoryRow,
} from './types/canvas-demo-chrome.js';
export { canvasStubEntity } from './canvas/canvas-stubs.js';
export { urnTwinfile, parseUrnTwinfile } from './ref/urn-twinfile.js';
export { copyRefAlternates } from './load/copy-ref-alternates.js';
export {
  loadTwinfile,
  validateTwinfileYamlPath,
  validatePlaceYamlPath,
  type LoadedTwinfile,
} from './load/load-twinfile.js';
export {
  registerPlaceLoadHooks,
  resetPlaceLoadHooksForTests,
} from './load/place-load-hooks.js';
export {
  isSceneAddress,
  listSceneRunIds,
  loadRunUnit,
  parseSceneAddress,
  sceneAddress,
  unitAddress,
  type SceneAddress,
} from './load/load-scene-run.js';
export {
  TWINFILE_UNIT_ROLE,
  RUN_PRESET_ROLE,
  isRunUnit,
  isPlaceTwinfileUnit,
  isRunComposeHead,
} from './load/twinfile-unit-role.js';
export { loadUnitRoot } from './load/load-unit-root.js';
export type { LoadedScene, SceneRun, SceneSchedule } from './types/scene-run.js';
export {
  validateDocumentAtPath,
  readYamlDocument,
  getDefaultValidator,
  inlineYamlDocument,
  validatePlanFile,
} from './validate/validate-yaml.js';
export { runReplayLines } from './runners/builtin-runners.js';
export {
  createTwinValidator,
  PLACE_LAYER_ROOT_KEYS,
  schemaIdForPlaceLayerDocument,
  ajvErrorsToTwinErrors,
} from './validate/create-validator.js';
export { ALLOWED_TWINFILE_ROOT_NAMES, isAllowedTwinfileRootEntry } from './load/twinfile-allowlist.js';
export {
  findTwinfileYamlPath,
  twinHeadFileName,
  twinHeadPath,
  twinLockFileName,
  twinLockPath,
} from './load/twinfile-locator.js';
export {
  twinfileBindingPaths,
  twinfileLayerPaths,
  manifestScenarioComposeRefs,
  type LayerMergeMode,
} from './load/twinfile-paths.js';
export { twinfileStepItems, setTwinfileStepItems } from './load/twinfile-compose.js';
export { parseModuleGraphFromTwinfile } from './patch/module-graph-twinfile.js';
export {
  isPatchesTwinfile,
  listTwinfileInstructions,
  listTwinfilePatchDocs,
  listTwinfileEventBindings,
  parseManifestPatches,
} from './load/twinfile-instructions.js';
export type {
  EventBindingDoc,
  TwinfileCopyInstruction,
  TwinfileInstruction,
  TwinfilePatchInstruction,
} from './types/twinfile-instructions.js';
export type {
  ComposedPlace,
  PlaceComposeEntry,
  PlaceComposeLayer,
  PlaceComposeRole,
  ResolvedPlaceAxes,
} from './types/place-compose.js';
export {
  checkPlaceLayoutIndex,
  readLayoutIndexDocument,
  LAYOUT_INDEX_REL,
  LAYOUT_INDEX_SCHEMA_ID,
  type LayoutIndexDocument,
  type LayoutIndexRegion,
} from './check/layout-index.js';
export {
  loadEventRoleVocabulary,
  eventRoleVocabularyPath,
  checkExpectsAgainstVocabulary,
  checkPlanRolesExact,
  checkPlaceRoleTags,
  checkPlaceRolesInVocabulary,
  type EventRoleVocabulary,
  type EventRoleVocabularyEntry,
} from './check/event-role-vocabulary.js';
export { collectPlaceIdsForRole, planRolesFromPlace } from './check/event-roles.js';
export { runScenarioRunner, digestFile, type RunHostResult } from './runners/runner-host.js';
export { composeRunners, type ComposePayload, type ComposeResult } from './runners/compose-runners.js';
export { assembleRunRecords, sendRunCommands } from './runners/run-commands.js';
export { catalogResolveOptions } from './paths/catalog-resolve-options.js';
export type { ExpectsRole, PlaceData, PlanRoles } from './build/contract-checker.js';
export { performBridgeImport } from './bridge/perform-bridge-import.js';
export {
  assertCrosswalkPlacement,
  clearCrosswalkCacheForTests,
  crosswalkPath,
  crosswalkRows,
  crosswalkValue,
  exportExternal,
  geotypeSlugForMapping,
  importExternal,
  loadCrosswalk,
  optionalCrosswalkValue,
  twinId,
  unmappedExt,
  writeImportedFiles,
  type CrosswalkRow,
  type ExternalSource,
  type GtfsInput,
  type ImportResult,
} from '@doppler-group/twinfile-bridge';
