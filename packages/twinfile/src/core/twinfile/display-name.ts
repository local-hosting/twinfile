/** Fallback when no display `name`, place fiction, or id to derive from. */
export const TWINFILE_UNTITLED_DISPLAY = 'Untitled';

/** Prose label for manifest `kind` — YAML and `head.kind` stay `place`. */
export function twinfileManifestKindLabel(kind: string | undefined): string {
  switch (kind) {
    case 'place':
      return 'Site';
    case 'scenario':
      return 'Scenario';
    case 'event':
      return 'Event';
    default:
      if (!kind?.trim()) return 'Twinfile';
      return kind.charAt(0).toUpperCase() + kind.slice(1);
  }
}

/**
 * Twinfile head: **`id`** = ref slug (`twinfile/<id>:<version>`); **`name`** = display name for UI.
 */

/** Labeled ref chip for cards and markdown (`id slug@version`). */
export function twinfileRefLabel(id: string, version: string): string {
  return `id ${id}@${version}`;
}

export function titleFromRefId(id: string): string {
  return id
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function twinfileHeadString(head: Record<string, unknown>, key: string): string | undefined {
  const value = head[key];
  return typeof value === 'string' ? value.trim() : undefined;
}

/** Published ref slug from Twinfile head (`id`). */
export function twinfileRefId(head: Record<string, unknown>): string | undefined {
  return twinfileHeadString(head, 'id');
}

/**
 * Display name for cards, workbench chrome, and catalog labels.
 * Order: head `name` → composed `place.name` (when `place` bundle provided) → titleized `id`.
 */
export function twinfileDisplayName(
  head: Record<string, unknown>,
  place?: Record<string, unknown>,
): string {
  const display = twinfileHeadString(head, 'name');
  if (display) return display;

  const kind = twinfileHeadString(head, 'kind');
  const id = twinfileRefId(head);

  if (kind === 'scenario' && id) return titleFromRefId(id);

  const site = place?.place;
  if (site && typeof site === 'object' && !Array.isArray(site)) {
    const siteName = (site as { name?: unknown }).name;
    if (typeof siteName === 'string' && siteName.trim()) return siteName.trim();
  }

  if (id) return titleFromRefId(id);
  return TWINFILE_UNTITLED_DISPLAY;
}
