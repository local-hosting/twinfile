import type { StoryPlanningSegmentProfileV1 } from './story-plan.js';

export type StoryJourneyRefV1 = {
  id: string;
  label?: string;
};

export type StoryPlanningJtbdCatalogV1 = {
  specVersion: string;
  jobs: Array<{ id: string; label?: string; when?: string; want?: string; so?: string; needId?: string }>;
};

export type StoryPlanningObstacleCatalogV1 = {
  specVersion: string;
  obstacles: Array<{ id: string; label?: string; jobId?: string; removable?: boolean }>;
};

export type StoryPlanningPersonaCatalogV1 = {
  specVersion: string;
  personas: Array<{
    id: string;
    label?: string;
    name?: string;
    quote?: string;
    painPoints?: string[];
    segmentAffinities?: Array<{ segmentId: string; weight?: number }>;
    priorityJobIds?: string[];
  }>;
};

export type StoryPlanningCustomerCatalogV1 = {
  specVersion: string;
  engagementLevels?: Array<{ id: string; label?: string; validIntentIds?: string[] }>;
  intents?: Array<{ id: string; label?: string; opportunityId?: string }>;
  focusAreas?: Array<{ id: string; label?: string }>;
  opportunities?: Array<{ id: string; label?: string }>;
};

export type StoryPlanningSegmentCatalogV1 = {
  specVersion: string;
  segments: StoryPlanningSegmentProfileV1[];
};

/** Derived planning slices from mounted Character documents (no locker I/O). */
export type StoryPlanningCatalogsFromCharactersV1 = {
  storyJourneyRefs?: StoryJourneyRefV1[];
  segmentCatalog?: StoryPlanningSegmentCatalogV1;
  personaCatalog?: StoryPlanningPersonaCatalogV1;
  customerCatalog?: StoryPlanningCustomerCatalogV1;
  jtbdCatalog?: StoryPlanningJtbdCatalogV1;
  obstacleCatalog?: StoryPlanningObstacleCatalogV1;
  /** Customer context brief derived from mounted Character personas (not org/account lockers). */
  storyPlanningGuide?: string;
};