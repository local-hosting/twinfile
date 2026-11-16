/**
 * Browser-safe @doppler-group/twinfile-core surface for the workbench SPA build.
 * Avoids resolving the Node-oriented package barrel (fs, pack, MCP, …).
 */
import type { TwinfileUseMode } from '../../core/dist/types/twinfile-spec.js';

import {
  DEFAULT_DTPR_SCHEMA_VERSION,
  dtprApiBaseUrl,
  dtprElementIconUrl,
  elementLabelsForInlineDtpr,
  fetchDtprElementLabels,
  fetchDtprLabelsForDisclosures,
  flattenInlineElementIds,
  humanizeDtprElementId,
  resolveDtprSchemaVersion,
} from '../../core/dist/dtpr/dtpr-public-api.js';
import { listDtprDisclosures } from '../../core/dist/dtpr/list-disclosures.js';
import {
  formatBuildLayerScope,
  formatBuildLayerStepLabel,
} from '../../core/dist/build/build-layer-label.js';

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
  listDtprDisclosures,
  formatBuildLayerScope,
  formatBuildLayerStepLabel,
};

export { TWINFILE_SUMMARY_LAYOUT_ID } from '../../core/dist/types/twinfile-spec.js';
export type { TwinfileUseMode };
export type { DtprDisclosureRow } from '../../core/dist/dtpr/list-disclosures.js';
export type { ProcessorsResourceV1 } from '../../core/dist/types/processors-resource.js';
export type {
  TwinfileSummaryV1,
  TwinfileSummaryHeader,
  TwinfileSummaryAspect,
  TwinfileSummaryIoPort,
  TwinfileSummaryBlock,
  TwinfileSummaryLayoutV1,
  TwinfileSummaryLayoutRow,
  TwinfileSummaryBase,
  BuildTwinfileSummaryInput,
} from '../../core/dist/types/twinfile-summary.js';

/** All place rows visible in the single place view. */
export function placeRowMatchesUseMode(_row: Record<string, unknown>, _mode?: TwinfileUseMode): boolean {
  return true;
}

export function filterPlaceRowsByUseMode<T extends Record<string, unknown>>(rows: T[], _mode?: TwinfileUseMode): T[] {
  return rows;
}

export {
  createSessionClockBus,
  replaySessionClockRecords,
  type CreateSessionClockBusOptions,
  type SessionClockBus,
  type SessionClockBusEvents,
  type SessionClockBusRecord,
  type SessionClockNote,
  type SessionClockTransport,
  type WorldSessionAdvance,
  type WorldSessionEdge,
} from '../../simulator/dist/index.js';
