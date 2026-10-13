/** Authoring form on a AXM (`rubric.yml` `kind`). */
export const AXM_KINDS = [
  'app',
  'site',
  'applet',
  'game',
  'kiosk',
  'venue',
  'vehicle',
  'device',
] as const;

export type AXMKind = (typeof AXM_KINDS)[number];

/**
 * Kinds with bundled samples under `test/fixtures/axm-repos/{kind}/`.
 * Place- and surface-scoped forms (alongside `game` and `kiosk`).
 */
export const AXM_FIXTURE_KINDS = [
  'game',
  'kiosk',
  'venue',
  'vehicle',
  'device',
] as const;

export type AXMFixtureKind = (typeof AXM_FIXTURE_KINDS)[number];

export function isAXMFixtureKind(kind: AXMKind): kind is AXMFixtureKind {
  return (AXM_FIXTURE_KINDS as readonly AXMKind[]).includes(kind);
}
