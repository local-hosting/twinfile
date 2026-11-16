import { describe, expect, it } from 'vitest';

import { digestBuffer } from '../src/build/digest-file.js';
import {
  buildTwinfileOciDistribution,
  manifestDigest,
} from '../src/pack/oci-distribution.js';
import { RefResolver } from '../src/ref/ref-resolver.js';
import {
  TWINFILE_OCI_ARTIFACT_TYPE,
  TWINFILE_TREE_ANNOTATION,
  ociRepository,
} from '../src/types/oci-artifact.js';

describe('buildTwinfileOciDistribution', () => {
  it('builds RFC 0002 artifact manifest', () => {
    const configBytes = Buffer.from('{"twinfile":1,"kind":"place","name":"shop","version":"0.1.0","stability":"example","spec":"1.0.0-draft.1"}\n');
    const treeBytes = Buffer.from('fake-tree');
    const treeDigest = digestBuffer(treeBytes);

    const twinfile = buildTwinfileOciDistribution({ configBytes, treeBytes, treeDigest });
    expect(twinfile.artifactType).toBe(TWINFILE_OCI_ARTIFACT_TYPE);
    expect(twinfile.layers[0]?.annotations?.[TWINFILE_TREE_ANNOTATION]).toBe(treeDigest);
    expect(manifestDigest(twinfile).startsWith('sha256:')).toBe(true);
  });
});

describe('ociRepository', () => {
  it('maps ghcr short ref to twinfile/name repo', () => {
    const resolver = new RefResolver();
    const resolved = resolver.resolve('twinfile/arena:1.2.0');
    expect(ociRepository(resolved)).toBe('doppler-group/twinfile/arena');
  });
});
