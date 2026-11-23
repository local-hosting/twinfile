const TWINFILE_KIND = '(?:place|scenario|event|base)';
const TWINFILE_UNIT = `[a-z0-9][a-z0-9-]{0,62}`;
const TWINFILE_TAG = `[0-9]+(?:\\.[0-9]+){0,2}(?:-[0-9A-Za-z.-]+)?`;
/** Must stay aligned with `@local-hosting/twinfile` `defs.json#/$defs/twinfileRef` (RFC 0008 typed segment). */
const OCI_GHCR = `oci:ghcr\\.io/(?:twinfile|local-hosting/twinfile)/(?:${TWINFILE_KIND}/)?${TWINFILE_UNIT}(?::${TWINFILE_TAG})?(?:@sha256:[a-f0-9]{64})?`;
export const TWINFILE_REF_PATTERN = new RegExp(`^(twinfile/(?:${TWINFILE_KIND}/)?${TWINFILE_UNIT}:${TWINFILE_TAG}|${OCI_GHCR})$`);
export function parseTwinfileRef(ref) {
    const trimmed = ref.trim();
    const short = /^twinfile\/(?:(place|scenario|event|base)\/)?([^:]+):(.+)$/.exec(trimmed);
    if (short) {
        return {
            kind: short[1],
            name: short[2],
            tag: short[3],
        };
    }
    const oci = /^oci:ghcr\.io\/(?:twinfile|local-hosting\/twinfile)\/(?:(place|scenario|event|base)\/)?([^:@]+)(?::([^@]+))?(?:@sha256:([a-f0-9]{64}))?$/.exec(trimmed);
    if (oci) {
        return {
            kind: oci[1],
            name: oci[2],
            tag: oci[3] ?? '',
        };
    }
    return undefined;
}
export function isTwinfileRef(value) {
    return TWINFILE_REF_PATTERN.test(value.trim());
}
/** `{kind}/{name}` identity for place-mount matching; kindless refs count as `place`, tag and digest are ignored. */
export function placeRefIdentity(ref) {
    const parsed = parseTwinfileRef(ref);
    if (!parsed)
        return undefined;
    return `${parsed.kind ?? 'place'}/${parsed.name}`;
}
export function samePlaceRef(a, b) {
    const left = placeRefIdentity(a);
    return left != null && left === placeRefIdentity(b);
}
/** Typed place ref for mounts without a published unit (Character places, geo anchors). */
export function placeRefForName(name, tag = '0.0.0') {
    const slug = name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 63);
    if (!slug)
        throw new Error(`placeRefForName: empty name "${name}"`);
    return `twinfile/place/${slug}:${tag}`;
}
/** Flat `twinfile/<name>:<tag>` for catalogs that key refs without the kind segment (RFC 0008). */
export function flatTwinfileRef(ref) {
    const parsed = parseTwinfileRef(ref.trim());
    if (!parsed || !parsed.tag)
        return ref.trim();
    return `twinfile/${parsed.name}:${parsed.tag}`;
}
