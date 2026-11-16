import { digestBuffer } from '../build/digest-file.js';
import {
  OCI_MANIFEST_MEDIA,
  TWINFILE_OCI_ARTIFACT_TYPE,
  TWINFILE_OCI_CONFIG_MEDIA,
  TWINFILE_OCI_TREE_MEDIA,
  TWINFILE_TREE_ANNOTATION,
  type OciImageManifest,
} from '../types/oci-artifact.js';

export type BuildManifestInput = {
  configBytes: Buffer;
  treeBytes: Buffer;
  treeDigest: string;
};

export function buildTwinfileOciDistribution(input: BuildManifestInput): OciImageManifest {
  const configDigest = digestBuffer(input.configBytes);
  const treeDigest = input.treeDigest.startsWith('sha256:')
    ? input.treeDigest
    : digestBuffer(input.treeBytes);

  return {
    schemaVersion: 2,
    mediaType: OCI_MANIFEST_MEDIA,
    artifactType: TWINFILE_OCI_ARTIFACT_TYPE,
    config: {
      mediaType: TWINFILE_OCI_CONFIG_MEDIA,
      digest: configDigest,
      size: input.configBytes.length,
    },
    layers: [
      {
        mediaType: TWINFILE_OCI_TREE_MEDIA,
        digest: treeDigest,
        size: input.treeBytes.length,
        annotations: {
          [TWINFILE_TREE_ANNOTATION]: treeDigest,
        },
      },
    ],
  };
}

export function manifestBytes(twinfile: OciImageManifest): Buffer {
  return Buffer.from(`${JSON.stringify(twinfile)}\n`, 'utf8');
}

export function manifestDigest(twinfile: OciImageManifest): string {
  return digestBuffer(manifestBytes(twinfile));
}
