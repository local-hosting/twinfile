import type { StoryCatalogMenuV1 } from './story-catalog-menu.js';
import type {
  StoryPlanCatalogSnapshotV1,
  StoryPlanFleetPlaceSnapshotV1,
} from './story-plan-catalog.js';
import type { TouchpointGraphWire } from './touchpoint-catalog.js';

export type StoryPlanningSegmentObjectiveV1 = {
  intentId: string;
  validLevelIds?: string[];
  touchpointSequences?: Record<string, unknown>;
};

export type StoryPlanningSegmentProfileV1 = {
  id: string;
  label?: string;
  journeyPace?: string;
  objectives?: StoryPlanningSegmentObjectiveV1[];
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

export type StoryPlanningCustomerCatalogV1 = {
  engagementLevels?: Array<{ id: string; label?: string; validIntentIds?: string[] }>;
  intents?: Array<{ id: string; label?: string }>;
  focusAreas?: Array<{ id: string; label?: string }>;
};

export type StoryPlanningFocusInterestV1 = {
  focusAreaIds: string[];
  primaryFocusAreaId: string;
};

export type StoryPlanSegmentNarrativeV1 = {
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

export type StoryPlanNarrativeContextV1 = {
  storyPlanningGuide?: string;
  planningDefaults: {
    planningHorizonDays: number;
    useFeedCalendar: boolean;
    episodePhases: string;
  };
  segments: StoryPlanSegmentNarrativeV1[];
  engagementLevels: Array<{ id: string; label?: string; validIntentIds?: string[] }>;
  intents: Array<{ id: string; label?: string }>;
  focusAreas: Array<{ id: string; label?: string }>;
  jobsToBeDone: Array<{ id: string; label?: string }>;
  obstacles: Array<{ id: string; label?: string }>;
  journeys: Array<{ id: string; label?: string; focalCharacterId?: string; journeyId?: string }>;
  touchpoints: Array<{
    id: string;
    label?: string;
    journeyPhase?: string;
    locus?: string;
  }>;
  hubTouchpointId?: string;
  fleetPlaces: StoryPlanFleetPlaceSnapshotV1[];
};

export type StoryPlanScenarioHintsV1 = {
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

export type StoryPlanInputV1 = {
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
  characterId?: string;
  storyId?: string;
  placeRef?: string;
  planningHorizonDays?: number;
  visitDayOffset?: number;
  useFeedCalendar?: boolean;
};

export type StoryPlanExtractedHintsV1 = {
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
  characterId?: string;
  storyId?: string;
  placeRef?: string;
  planningHorizonDays?: number;
  visitDayOffset?: number;
  useFeedCalendar?: boolean;
};

export type StoryPlanChecklistItemV1 = {
  id: string;
  ok: boolean;
  detail: string;
};

export type StoryPlanExtractionSegmentBriefV1 = {
  id: string;
  label?: string;
  topic?: string;
  needsSummary?: string;
  intentIds: string[];
};

export type StoryPlanExtractionIndexV1 = {
  storyPlanningGuide?: string;
  characters?: Array<{ characterId: string; label: string; journeyIds: string[] }>;
  stories?: Array<{ id: string; title: string; focalCharacterId: string }>;
  places?: Array<{ placeRef: string; title: string }>;
  segmentIds: string[];
  segmentLabels: Record<string, string | undefined>;
  segments: StoryPlanExtractionSegmentBriefV1[];
  storeSlugs: string[];
  storeNames: Record<string, string | undefined>;
  engagementLevelIds: string[];
  intentIds: string[];
  focusAreaIds: string[];
  journeyIds: string[];
  characterIds: string[];
  storyIds: string[];
  jobIds: string[];
};

export type StoryPlanNarrativeBuildInputV1 = {
  segments: StoryPlanningSegmentProfileV1[];
  customerCatalog?: StoryPlanningCustomerCatalogV1;
  jobs?: Array<{ id: string; label?: string }>;
  obstacles?: Array<{ id: string; label?: string }>;
  journeys: Array<{ id: string; label?: string; focalCharacterId?: string; journeyId?: string }>;
  storyMenu?: StoryCatalogMenuV1;
  fleetPlaces: readonly StoryPlanFleetPlaceSnapshotV1[];
  touchpointGraph?: TouchpointGraphWire;
  storyPlanningGuide?: string;
  maxTouchpoints?: number;
  maxJobs?: number;
};

export type StoryPlanCatalogBuildInputV1 = {
  segments: StoryPlanningSegmentProfileV1[];
  customerCatalog?: StoryPlanningCustomerCatalogV1;
  engagementLevelIds: string[];
  intentIds: string[];
  focusAreaIds: string[];
  journeyIds: string[];
  characterIds: string[];
  storyIds: string[];
  storyMenu?: StoryCatalogMenuV1;
  jobIds: string[];
  fleetPlaces: readonly StoryPlanFleetPlaceSnapshotV1[];
  touchpointCount: number;
  hubTouchpointId?: string;
  touchpointIdsSample: readonly string[];
};

export type { StoryPlanCatalogSnapshotV1 };
