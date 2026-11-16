/** Monorepo layout and catalog discovery — prefer importing from here inside core. */
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
  resolveSimulatorPackageRoot,
  resolveTwinCatalogOperateRoots,
  resolveTwinfileRoot,
  resolveTwinfileRootFromImportMeta,
  resolveTwinfileRootFromPlaceCatalog,
  resolveTypeExamplesRoot,
  typeExamplesRootCandidates,
  type TwinCatalogType,
} from './catalog-layout.js';
export {
  isExamplesCatalogRoot,
  isFlatExamplesCatalogRoot,
  isLegacyExamplesCatalogRoot,
  listFlatExampleUnitNames,
} from './examples-catalog.js';
export { resolveExamplesRoot, resolveExamplesRoots } from './resolve-examples-root.js';
export { resolveSimulatorRoot, resolveSimulatorRoots } from './resolve-simulator-root.js';
export { catalogResolveOptions } from './catalog-resolve-options.js';
export {
  GOLDEN_SCENE_RUN_RELPATHS,
  goldenSceneRunRelPath,
  resolveGoldenSceneRunDir,
} from './golden-scene-runs.js';
export { resolveSpecConfPath, resolveSpecPackageRoot } from './resolve-spec-conf.js';