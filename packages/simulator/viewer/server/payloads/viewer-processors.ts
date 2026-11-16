import {
  type BuildTwinfileResult,
} from '@doppler-group/twinfile-place';
import {
  buildProcessorsResourceFromTwinfile,
  type ProcessorsResourceV1,
} from '@doppler-group/twinfile-core';

export type ViewerProcessorsPayload = {
  schema: 'twinfile.viewer.processors.v1';
  sectionId: 'processors.patch';
  resource: ProcessorsResourceV1;
};

export function buildViewerProcessorsPayload(result: BuildTwinfileResult): ViewerProcessorsPayload | undefined {
  const resource = buildProcessorsResourceFromTwinfile(result.loaded.twinfile, {
    digest: result.digest,
  });
  if (!resource) return undefined;
  return {
    schema: 'twinfile.viewer.processors.v1',
    sectionId: 'processors.patch',
    resource,
  };
}
