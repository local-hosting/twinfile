import { join } from 'node:path';
import { loadYamlCatalog } from '../catalog/load-yaml-catalog.js';
import { resolveCharacterCatalogsRoot } from '../catalog/resolve-package-root.js';
import type { JourneyTouchpointCatalog } from './adapters/journey-touchpoint-catalog.js';
import {
  JourneyTouchpointZoneCatalogFileSchema,
  type JourneyTouchpointZoneCatalogFile,
} from './journey-touchpoint-catalog.schema.js';
import {
  MobilityHubJourneyCatalogSchema,
  type MobilityHubJourneyCatalog,
  type MobilityHubJourneyStage,
  type MobilityHubJourneyZone,
} from './mobility-hub-journey.schema.js';

export const MOBILITY_HUB_TOUCHPOINTS_CATALOG_PATH =
  'journey/mobility-hub-touchpoints.yaml';
export const MOBILITY_HUB_JOURNEY_MODES_CATALOG_PATH =
  'journey/mobility-hub-journey-modes.yaml';

let cachedTouchpoints: JourneyTouchpointZoneCatalogFile | undefined;
let cachedJourneyModes: MobilityHubJourneyCatalog | undefined;

/** Load the mobility hub zone-grouped touchpoint catalog from YAML. */
export function loadMobilityHubTouchpointZoneCatalog(): JourneyTouchpointZoneCatalogFile {
  cachedTouchpoints ??= loadYamlCatalog(
    join(
      resolveCharacterCatalogsRoot(import.meta.url),
      MOBILITY_HUB_TOUCHPOINTS_CATALOG_PATH,
    ),
    JourneyTouchpointZoneCatalogFileSchema,
  );
  return cachedTouchpoints;
}

/** Touchpoint catalog keyed by short zone ids (A1-place, Z5-pick, …). */
export function mobilityHubJourneyTouchpointCatalog(): JourneyTouchpointCatalog {
  return loadMobilityHubTouchpointZoneCatalog().zones;
}

/** Load stage and zone metadata for the mobility hub journey model from YAML. */
export function loadMobilityHubJourneyModeCatalog(): MobilityHubJourneyCatalog {
  cachedJourneyModes ??= loadYamlCatalog(
    join(
      resolveCharacterCatalogsRoot(import.meta.url),
      MOBILITY_HUB_JOURNEY_MODES_CATALOG_PATH,
    ),
    MobilityHubJourneyCatalogSchema,
  );
  return cachedJourneyModes;
}

export function mobilityHubJourneyStageById(
  stageId: string,
  catalog: MobilityHubJourneyCatalog = loadMobilityHubJourneyModeCatalog(),
): MobilityHubJourneyStage | undefined {
  return catalog.stages.find((row) => row.id === stageId);
}

export function mobilityHubJourneyZoneById(
  zoneId: string,
  catalog: MobilityHubJourneyCatalog = loadMobilityHubJourneyModeCatalog(),
): MobilityHubJourneyZone | undefined {
  return catalog.zones.find((row) => row.id === zoneId);
}

export function mobilityHubJourneyZonesForStage(
  stageId: string,
  catalog: MobilityHubJourneyCatalog = loadMobilityHubJourneyModeCatalog(),
): MobilityHubJourneyZone[] {
  return catalog.zones.filter((row) => row.stageId === stageId);
}

export function mobilityHubJourneyStageForZone(
  zoneId: string,
  catalog: MobilityHubJourneyCatalog = loadMobilityHubJourneyModeCatalog(),
): MobilityHubJourneyStage | undefined {
  const zone = mobilityHubJourneyZoneById(zoneId, catalog);
  if (!zone) return undefined;
  return mobilityHubJourneyStageById(zone.stageId, catalog);
}

/** Reset cached YAML catalogs — for tests only. */
export function resetMobilityHubJourneyCatalogCache(): void {
  cachedTouchpoints = undefined;
  cachedJourneyModes = undefined;
}
