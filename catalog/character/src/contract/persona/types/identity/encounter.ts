import type { AXMHostContext } from './context.js';

/** Channel / modality / locus slice (orthogonal to AXM `kind`). */
export type AXMEncounterChannel =
  | 'media'
  | 'store'
  | 'website'
  | 'social'
  | 'app'
  | 'map';

export type AXMEncounterModality =
  | 'physical_space'
  | 'mobile'
  | 'web'
  | 'vr'
  | 'ar'
  | 'mr'
  | 'game'
  | 'stream'
  | 'social'
  | 'wearable'
  | 'kiosk'
  | 'venue'
  | 'vehicle'
  | 'device'
  | 'broadcast';

export type AXMEncounterLocus = 'physical' | 'digital' | 'blended';

export type AXMEncounterRole =
  | 'hub'
  | 'entry_point'
  | 'satellite'
  | 'onsite_companion'
  | 'blended_bridge';

export type AXMEncounter = {
  channel?: AXMEncounterChannel;
  modality?: AXMEncounterModality;
  locus?: AXMEncounterLocus;
  role?: AXMEncounterRole;
  /** Where this surface is experienced — e.g. kiosk `modality` inside a `venue` host. */
  host?: AXMHostContext;
};
