import type { AXMKind } from './kind.js';

/**
 * Containing place or platform when a surface runs inside another context
 * (kiosk at a venue, app in a vehicle, device on a vehicle, etc.).
 */
export type AXMHostContext = {
  kind: AXMKind;
  /** Linked AXM id when the host has its own repo (`rubric:` / embed). */
  rubricId?: string;
  label?: string;
  zoneId?: string;
};
