/**
 * @local-hosting/twinfile-simulator — place event catalog, timeline, and session playback (transforms built places).
 */

export {
  EventCatalog,
  createEventCatalog,
  registerEventCatalog,
  clearRegisteredEventCatalogs,
  mergedEventCatalog,
  getRegisteredPlaceEvent,
  resolveRegisteredPlaceEventRef,
} from './catalog/event-catalog.js';
export {
  definePlaceEvent,
  placeEventRequestMessages,
} from './catalog/place-event-request.js';
export {
  placeEventToHead,
  placeEventRef,
  placeEventCatalogKind,
} from './catalog/place-event-head.js';
export { loadedTwinfileFromPlaceEvent } from './catalog/synthetic-place-event-load.js';
export {
  ensureSimulatorEventCatalog,
  resetSimulatorEventCatalogBootstrap,
} from './catalog/bootstrap-simulator-catalog.js';
export { ensureExamplesEventCatalog, resetExamplesEventCatalogBootstrap } from './catalog/bootstrap-examples-catalog.js';
export { simulatorBuiltinEventCatalog } from './catalog/builtin/index.js';

export type { PlaceEvent, PlaceEventRequest, PlaceEventHead } from './types/place-event.js';
export type {
  SituationPulseKind,
  SituationPulseEdge,
  SituationPulsePayload,
  BuildSituationMessageInput,
} from './types/situation-pulse.js';
export type { SessionPlaybackMeta } from './types/session-playback.js';
export type {
  SessionClockBus,
  SessionClockBusEvents,
  SessionClockBusRecord,
  SessionClockNote,
  SessionClockTransport,
} from './types/session-clock-bus.js';
export type {
  TFSessionBus,
  TFSessionBusHandler,
  CreateTFSessionBusOptions,
} from './types/tf-session-bus.js';
export { createTFSessionBus } from './types/tf-session-bus.js';
export type { TFMessageBus, PatchMessageHandler, TwinMessagePortRef, TwinMessageV1 } from './types/tf-message-bus.js';
export { createTFMessageBus } from './types/tf-message-bus.js';
export type { WorldSessionEdge, WorldSessionAdvance } from './types/world-session.js';

export {
  TFPlace,
  activeTFPlace,
  type TFWorld,
  type TFClock,
  type TFPlaceOptions,
  type TFPlaceLoadOptions,
} from './types/tf-runtime.js';
export {
  timelineOptionsFromTFPlace,
  openPlaceTimeline,
  createWorldSessionForTFPlace,
} from './place/tf-place-timeline.js';
export {
  createTimeline,
  openTimelineForPlace,
  createPlaceTimelinePayload,
  type Timeline,
  type TimelineOptions,
  type TFPlaceTimelineOptions,
} from './timeline/timeline.js';
export {
  createWorldSession,
  type WorldSession,
  type WorldSessionOptions,
} from './timeline/world-session.js';
export { formatSessionEdge } from './timeline/format-session-edge.js';
export { snapPlayheadT } from './timeline/snap-playhead.js';
export { worldSessionEdgesBetween } from './timeline/world-session-edges.js';
export {
  createWorldClockPlayback,
  type WorldClockPlayback,
  type WorldClockPlaybackOptions,
  type WorldClockPlaybackState,
} from './timeline/world-clock-playback.js';
export {
  createSessionClockBus,
  publishSessionClockMove,
  replaySessionClockRecords,
  sessionClockEdgesFromRecords,
  sessionClockNoteTimes,
  type CreateSessionClockBusOptions,
} from './timeline/session-clock-bus.js';
export { createClock, parseInstant, type Clock } from './timeline/clock.js';
export {
  Weather,
  createWeathersFromPlace,
  mergeWeatherPhaseEnds,
  mergeWeatherPhaseStarts,
} from './weather/weather.js';
export {
  TFWeather,
  createTFWeathersFromPlace,
} from './weather/tf-weather.js';
export {
  createTFPlaceSession,
  type TFPlaceSession,
  type CreateTFPlaceSessionOptions,
} from './session/tf-place-session.js';
export {
  createTFPlaceRuntime,
  type TFPlaceRuntime,
  type CreateTFPlaceRuntimeOptions,
} from './session/tf-place-runtime.js';
export type { TFPlaceState, TFPlaceWeatherState } from './types/tf-place-state.js';
export {
  formatLocalDateTime,
  parseLocalDateTime,
  resolveScrubT,
  snapTToClock,
  tFromInstant,
} from './timeline/scrub.js';
export { scenarioUseMode, catalogUseMode, useModeAt, resolvePhaseStarts, resolvePhaseEnds } from './timeline/phase-starts.js';
export {
  loadFeedRows,
  resolveTrackFeeds,
  compileFeedSeries,
  type ResolveTrackFeedsOptions,
} from './timeline/feed.js';
export { pullFeedRows, feedRowsToJsonl, type FeedPullRequest } from './timeline/pull-feed.js';
export { generateSimulatedFeedRows, simulatedValueAt, type SimulatedDevice } from './timeline/simulate-feed.js';
export { sampleCoverageGraphV0 } from './timeline/coverage/engine-graph-v0.js';
export { sunElevationDeg } from './timeline/solar.js';
export type {
  ActiveSchedule,
  ClockSpec,
  FeedRow,
  FeedProtocol,
  GeoLocation,
  Interpolation,
  ScheduleDef,
  ScheduleUses,
  TimelinePayload,
  TimelineSample,
  PhaseStarts,
  PhaseEnds,
  PlaceTime,
  TrackDef,
  TrackSource,
  CoverageMetric,
  ActiveWhenGate,
  Occupancy,
  VisitBeatActive,
  VisitDef,
} from './types/twinfile-time.js';

export {
  PlaceHost,
  type PlaceHostOpenOptions,
  type PlaceHostNarrativeOptions,
} from './host/place-host.js';
export {
  buildPlaceNarrative,
  describeTwinAt,
  formatTwinMarkdown,
  type TwinNarrative,
  type PlaceNarrativeInput,
  type TrackReadingFact,
  type NarrativeSection,
  type DescribeTwinfileOptions,
} from './narrate/describe-twin.js';
export {
  createRunPayload,
  createRunPayloadFromTFPlace,
  type RunPayloadOptions,
  type RunPayloadFromTFPlaceOptions,
} from './runners/run-payload.js';
export { handleMcpRequest, type McpServeOptions } from './mcp/server.js';
export { runMcpStdio, MCP_PROTOCOL_VERSION, handleMcpProtocolMessage, type McpSession } from './mcp/protocol.js';
export {
  addBindToPlace,
  buildPlanRolesFromPlace,
  collectPlaceIdsForRole,
  type AddBindToPlaceOptions,
  type AddBindToPlaceResult,
} from './cli/add-plan-to-place.js';
export { registerSimulatorCatalog } from './register-catalog-resolver.js';

import './register-catalog-resolver.js';
