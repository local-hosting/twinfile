import type { TwinCatalogType } from '../paths/catalog-layout.js';

/** Row shapes match Fieldwise DS entity adapters (unsigned canvas demo chrome). */
export type CanvasDemoPlaceRow = {
  id: string;
  cardTitle: string;
  label: string;
  slug: string;
  orgVenueId: string;
  geo: string;
};

export type CanvasDemoCharacterRow = {
  id: string;
  cardTitle: string;
  label: string;
};

export type CanvasDemoResourceRow = {
  id: string;
  cardTitle: string;
  label: string;
  orgInventoryId: string;
  orgVehicleId: string;
  geo: string;
};

export type CanvasDemoStoryRow = {
  id: string;
  cardTitle: string;
  title: string;
  personaId: string;
  orgStoryboardId: string;
  mapSlug: string;
  storyPitch: string;
};

export type CanvasDemoEventRow = {
  id: string;
  cardTitle: string;
  label: string;
  dayIndex: string;
};

export type CanvasDemoProjectContent = {
  places: CanvasDemoPlaceRow[];
  characters: CanvasDemoCharacterRow[];
  stories: CanvasDemoStoryRow[];
  resources: CanvasDemoResourceRow[];
  events: CanvasDemoEventRow[];
  storyEventIds: Readonly<Record<string, readonly string[]>>;
};

export type CanvasDemoPackManifest = {
  twinfile: 1;
  id: string;
  description?: string;
  places: string[];
  characters: string[];
  resources: string[];
  stories: string[];
  events: string[];
  storyEventIds: Record<string, string[]>;
};

export type CanvasDemoPackId = 'canvas-demo';

export type CanvasDemoPackUnits = Record<TwinCatalogType, string[]>;