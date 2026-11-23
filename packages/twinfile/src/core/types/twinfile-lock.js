/** Unit lock suffix: `<unit>/<unit>.twin.lock`. */
export const TWIN_LOCK_SUFFIX = '.twin.lock';
export function lockRefKeyFromTwinfile(twinfile) {
    const id = String(twinfile.id ?? 'unknown');
    const version = String(twinfile.version ?? '0.0.0');
    return `twinfile/${id}:${version}`;
}
