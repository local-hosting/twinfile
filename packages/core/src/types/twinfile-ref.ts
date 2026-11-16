/** Published unit ref (`twinfile/name:tag` or pinned `oci:…`). */
export type TwinfileRef = string;

const TWINFILE_KIND = '(?:place|scenario|event|base)';
const TWINFILE_UNIT = `[a-z0-9][a-z0-9-]{0,62}`;
const TWINFILE_TAG = `[0-9]+(?:\\.[0-9]+){0,2}(?:-[0-9A-Za-z.-]+)?`;

/** Must stay aligned with `@local-hosting/twinfile` `defs.json#/$defs/twinfileRef` (RFC 0008 typed segment). */
const OCI_GHCR =
  `oci:ghcr\\.io/(?:twinfile|local-hosting/twinfile)/(?:${TWINFILE_KIND}/)?${TWINFILE_UNIT}(?::${TWINFILE_TAG})?(?:@sha256:[a-f0-9]{64})?`;

export const TWINFILE_REF_PATTERN = new RegExp(
  `^(twinfile/(?:${TWINFILE_KIND}/)?${TWINFILE_UNIT}:${TWINFILE_TAG}|${OCI_GHCR})$`,
);

export type TwinfileRefKind = 'place' | 'scenario' | 'event' | 'base';

export function parseTwinfileRef(ref: string): { kind?: TwinfileRefKind; name: string; tag: string } | undefined {
  const trimmed = ref.trim();
  const short = /^twinfile\/(?:(place|scenario|event|base)\/)?([^:]+):(.+)$/.exec(trimmed);
  if (short) {
    return {
      kind: short[1] as TwinfileRefKind | undefined,
      name: short[2]!,
      tag: short[3]!,
    };
  }
  const oci =
    /^oci:ghcr\.io\/(?:twinfile|local-hosting\/twinfile)\/(?:(place|scenario|event|base)\/)?([^:@]+)(?::([^@]+))?(?:@sha256:([a-f0-9]{64}))?$/.exec(
      trimmed,
    );
  if (oci) {
    return {
      kind: oci[1] as TwinfileRefKind | undefined,
      name: oci[2]!,
      tag: oci[3] ?? '',
    };
  }
  return undefined;
}

export function isTwinfileRef(value: string): value is TwinfileRef {
  return TWINFILE_REF_PATTERN.test(value.trim());
}

/** Flat `twinfile/<name>:<tag>` for catalogs that key refs without the kind segment (RFC 0008). */
export function flatTwinfileRef(ref: string): string {
  const parsed = parseTwinfileRef(ref.trim());
  if (!parsed || !parsed.tag) return ref.trim();
  return `twinfile/${parsed.name}:${parsed.tag}`;
}
