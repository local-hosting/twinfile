import type { SamStoryCatalogMenuV1 } from './story-catalog-menu.js';
import type {
  SamStoryPlanCatalogSnapshotV1,
  SamStoryPlanFleetPlaceSnapshotV1,
} from './story-plan-catalog.js';
import type { TouchpointGraphWire } from './touchpoint-catalog.js';

export type SamStoryPlanningSegmentObjectiveV1 = {
  intentId: string;
  validLevelIds?: string[];
  touchpointSequences?: Record<string, unknown>;
};

export type SamStoryPlanningSegmentProfileV1 = {
  id: string;
  label?: string;
  journeyPace?: string;
  objectives?: SamStoryPlanningSegmentObjectiveV1[];
  overview?: {
    name?: string;
    description?: string;
    aboutTheCustomer?: string;
    mindset?: string;
    journeyPace?: string;
    segmentInsights?: string[];
    watchoutsAndBarriers?: string;
    whatIsAttractive?: string;
  };
  mentalModel?: { mentalModel?: { byFocus?: Record<string, unknown> } };
  cognition?: unknown;
  empathy?: unknown;
  emotions?: unknown;
};

export type SamStoryPlanningCustomerCatalogV1 = {
  engagementLevels?: Array<{ id: string; label?: string; validIntentIds?: string[] }>;
  intents?: Array<{ id: string; label?: string }>;
  focusAreas?: Array<{ id: string; label?: string }>;
};

export type SamStoryPlanningFocusInterestV1 = {
  focusAreaIds: string[];
  primaryFocusAreaId: string;
};

export type SamStoryPlanSegmentNarrativeV1 = {
  id: string;
  label?: string;
  topic?: string;
  needsSummary?: string;
  journeyPace?: string;
  overviewName?: string;
  overviewSummary?: string;
  mindset?: string;
  primaryFocusAreaId?: string;
  primaryFocusAreaLabel?: string;
  empathyPositive?: string[];
  empathyNegative?: string[];
  successFeeling?: string;
  objectives: Array<{
    intentId: string;
    validEngagementLevelIds: string[];
    touchpointSequenceEngagementKeys: string[];
  }>;
  suggestedIntentIds: string[];
};

export type SamStoryPlanNarrativeContextV1 = {
  storyPlanningGuide?: string;
  planningDefaults: {
    planningHorizonDays: number;
    useFeedCalendar: boolean;
    episodePhases: string;
  };
  segments: SamStoryPlanSegmentNarrativeV1[];
  engagementLevels: Array<{ id: string; label?: string; validIntentIds?: string[] }>;
  intents: Array<{ id: string; label?: string }>;
  focusAreas: Array<{ id: string; label?: string }>;
  jobsToBeDone: Array<{ id: string; label?: string }>;
  obstacles: Array<{ id: string; label?: string }>;
  journeys: Array<{ id: string; label?: string; focalPcmId?: string; journeyId?: string }>;
  touchpoints: Array<{
    id: string;
    label?: string;
    journeyPhase?: string;
    locus?: string;
  }>;
  hubTouchpointId?: string;
  fleetPlaces: SamStoryPlanFleetPlaceSnapshotV1[];
};

export type SamStoryPlanScenarioHintsV1 = {
  scenario?: string;
  topic?: string;
  goals?: string[];
  jobIds?: string[];
  notes?: string;
  segmentId?: string;
  storeSlug?: string;
  storeName?: string;
  place?: string;
  engagementLevelId?: string;
  intentId?: string;
};

export type SamStoryPlanInputV1 = {
  request?: string;
  scenario?: string;
  extractFromRequest?: boolean;
  topic?: string;
  goals?: string[];
  jobIds?: string[];
  notes?: string;
  useLlm?: boolean;
  create?: boolean;
  seed?: string | number;
  segmentId?: string;
  storeSlug?: string;
  storeName?: string;
  place?: string;
  engagementLevelId?: string;
  intentId?: string;
  focusAreaId?: string;
  interestIds?: string[];
  pcmId?: string;
  episodeId?: string;
  placeRef?: string;
  planningHorizonDays?: number;
  visitDayOffset?: number;
  useFeedCalendar?: boolean;
};

export type SamStoryPlanExtractedHintsV1 = {
  scenarioSummary?: string;
  topic?: string;
  goals?: string[];
  jobIds?: string[];
  constraints?: string[];
  notes?: string;
  segmentId?: string;
  storeSlug?: string;
  storeName?: string;
  place?: string;
  engagementLevelId?: string;
  intentId?: string;
  focusAreaId?: string;
  interestIds?: string[];
  pcmId?: string;
  episodeId?: string;
  placeRef?: string;
  planningHorizonDays?: number;
  visitDayOffset?: number;
  useFeedCalendar?: boolean;
};

export type SamStoryPlanChecklistItemV1 = {
  id: string;
  ok: boolean;
  detail: string;
};

export type SamStoryPlanExtractionSegmentBriefV1 = {
  id: string;
  label?: string;
  topic?: string;
  needsSummary?: string;
  intentIds: string[];
};

export type SamStoryPlanExtractionIndexV1 = {
  storyPlanningGuide?: string;
  characters?: Array<{ pcmId: string; label: string; journeyIds: string[] }>;
  episodes?: Array<{ id: string; title: string; focalPcmId: string; journeyId?: string }>;
  places?: Array<{ placeRef: string; title: string }>;
  segmentIds: string[];
  segmentLabels: Record<string, string | undefined>;
  segments: SamStoryPlanExtractionSegmentBriefV1[];
  storeSlugs: string[];
  storeNames: Record<string, string | undefined>;
  engagementLevelIds: string[];
  intentIds: string[];
  focusAreaIds: string[];
  journeyIds: string[];
  pcmIds: string[];
  samEpisodeIds: string[];
  jobIds: string[];
};

export type SamStoryPlanNarrativeBuildInputV1 = {
  segments: SamStoryPlanningSegmentProfileV1[];
  customerCatalog?: SamStoryPlanningCustomerCatalogV1;
  jobs?: Array<{ id: string; label?: string }>;
  obstacles?: Array<{ id: string; label?: string }>;
  journeys: Array<{ id: string; label?: string; focalPcmId?: string; journeyId?: string }>;
  storyMenu?: SamStoryCatalogMenuV1;
  fleetPlaces: readonly SamStoryPlanFleetPlaceSnapshotV1[];
  touchpointGraph?: TouchpointGraphWire;
  storyPlanningGuide?: string;
  maxTouchpoints?: number;
  maxJobs?: number;
};

export type SamStoryPlanCatalogBuildInputV1 = {
  segments: SamStoryPlanningSegmentProfileV1[];
  customerCatalog?: SamStoryPlanningCustomerCatalogV1;
  engagementLevelIds: string[];
  intentIds: string[];
  focusAreaIds: string[];
  journeyIds: string[];
  pcmIds: string[];
  samEpisodeIds: string[];
  storyMenu?: SamStoryCatalogMenuV1;
  jobIds: string[];
  fleetPlaces: readonly SamStoryPlanFleetPlaceSnapshotV1[];
  touchpointCount: number;
  hubTouchpointId?: string;
  touchpointIdsSample: readonly string[];
  axmMenu?: SamStoryCatalogMenuV1;
};

export type { SamStoryPlanCatalogSnapshotV1 };
