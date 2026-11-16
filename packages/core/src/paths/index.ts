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
  resolveSimulatorRoot,
  resolveTwinfileRoot,
  resolveTypeExamplesRoot,
  type TwinCatalogType,
} from './catalog-layout.js';
export {
  isExamplesCatalogRoot,
  isFlatExamplesCatalogRoot,
  listFlatExampleUnitNames,
} from './examples-catalog.js';
export { resolveExamplesRoot } from './resolve-examples-root.js';
export { catalogResolveOptions } from './catalog-resolve-options.js';
export {
  GOLDEN_SCENE_RUN_RELPATHS,
  goldenSceneRunRelPath,
  resolveGoldenSceneRunDir,
} from './golden-scene-runs.js';
export { resolveSpecConfPath, resolveSpecPackageRoot } from './resolve-spec-conf.js';
