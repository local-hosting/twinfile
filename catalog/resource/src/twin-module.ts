import { createHeadTwinTypeModule } from '@local-hosting/twinfile-core';

export const headFile = 'Resource.yaml';
export const kind = 'resource' as const;

export const module = createHeadTwinTypeModule({ kind, headFile });
