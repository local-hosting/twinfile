const URN_RE = /^urn:twinfile:([^:]+):([^:]+):([^:]+)$/;

/** Logical twin IRI alongside `twinfile/<type>/<id>:<ver>`. */
export function urnTwinfile(type: string, id: string, ver: string): string {
  return `urn:twinfile:${type}:${id}:${ver}`;
}

export function parseUrnTwinfile(
  urn: string,
): { type: string; id: string; ver: string } | undefined {
  const m = URN_RE.exec(urn.trim());
  if (!m) return undefined;
  return { type: m[1], id: m[2], ver: m[3] };
}