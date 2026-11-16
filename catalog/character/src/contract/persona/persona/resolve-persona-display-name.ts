import type { PCM } from '../types/pcm.js';
import { pcmCatalogLabel } from '../contract/pcm-catalog-display.js';

/** Resolve a story-instance display name from PCM persona fields and optional override. */
export function resolvePcmPersonaDisplayName(pcm: PCM, displayNameOverride?: string): string {
  const override = displayNameOverride?.trim();
  if (override) return override;
  return pcmCatalogLabel(pcm);
}
