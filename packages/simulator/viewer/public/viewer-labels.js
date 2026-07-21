/** Keep in sync with `@local-hosting/twinfile-core` `twinfileManifestKindLabel`. */
export function twinfileManifestKindLabel(kind) {
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
