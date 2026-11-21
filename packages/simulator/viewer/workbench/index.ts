/** Pure catalog / URL helpers for the examples viewer (and product hosts). */
export {
  WORKBENCH_DEFAULT_VARIATION,
  WORKBENCH_TWINFILE_VARIATION,
  normalizeWorkbenchVariation,
} from '../workbench-variation.js';
export {
  applyProgrammeLensPick,
  resolveSessionCatalogId,
  resolveWorkbenchChrome,
  resolveWorkbenchHostContext,
} from '../workbench-selection.js';
export {
  filterCatalogForHostPlaceProgramme,
  filterCatalogForHostPlaceSubNav,
  isWorkbenchProgrammeLens,
  listWorkbenchHostPlaceTabs,
  programmeEntryKindLabel,
  resolveHostPlaceCatalogId,
} from '../workbench-host-place-scope.js';
export {
  buildWorkbenchCatalogTree,
  workbenchCatalogBranchAncestors,
  workbenchPlaceTreeEntries,
  type WorkbenchCatalogTreeNode,
} from '../workbench-catalog-tree.js';
export { rootHostPlaceTabLabel } from '../workbench-host-place-tab-label.js';
export {
  readWorkbenchUrl,
  writeWorkbenchLens,
  writeWorkbenchSelection,
  writeWorkbenchVariation,
  type WorkbenchUrlState,
} from '../workbench-url.js';
export {
  mergeSessionClockChrome,
  sessionSampleFromNote,
  type SessionClockChrome,
} from '../session-clock-bus-workbench.js';
