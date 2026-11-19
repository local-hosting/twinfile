import type { ResolvedRef } from '../ref/ref-resolver.js';

export const TWINFILE_OCI_ARTIFACT_TYPE = 'application/vnd.twinfile.twinfile.v1';
export const TWINFILE_OCI_CONFIG_MEDIA = 'application/vnd.twinfile.config.v1+json';
export const TWINFILE_OCI_TREE_MEDIA = 'application/vnd.twinfile.tree.v1.tar+gzip';
export const TWINFILE_TREE_ANNOTATION = 'org.twinfile.tree';
export const OCI_MANIFEST_MEDIA = 'application/vnd.oci.image.twinfile.v1+json';

export type OciBlobDescriptor = {
  mediaType: string;
  digest: string;
  size: number;
  annotations?: Record<string, string>;
};

export type OciImageManifest = {
  schemaVersion: 2;
  mediaType: typeof OCI_MANIFEST_MEDIA;
  artifactType: typeof TWINFILE_OCI_ARTIFACT_TYPE;
  config: OciBlobDescriptor;
  layers: OciBlobDescriptor[];
};

export function ociRepository(resolved: ResolvedRef): string {
  const name = resolved.name ?? 'unknown';
  const host = resolved.registry ?? 'ghcr.io';
  const ns = resolved.namespace;
  if (ns && ns.startsWith(`${host}/`)) {
    return `${ns.slice(host.length + 1)}/${name}`;
  }
  if (ns) {
    return `${ns}/${name}`;
  }
  return `twinfile/${name}`;
}

export function registryHost(resolved: ResolvedRef, override?: string): string {
  return override ?? resolved.registry ?? 'ghcr.io';
}

export function manifestReference(resolved: ResolvedRef): string {
  if (resolved.digest) {
    return resolved.digest;
  }
  if (resolved.tag) {
    return resolved.tag;
  }
  throw new Error('Ref must include tag or digest');
}
