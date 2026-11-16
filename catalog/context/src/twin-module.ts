import { createHeadTwinTypeModule } from '@local-hosting/twinfile-core';

export const kind = 'context' as const;

export const module = createHeadTwinTypeModule({ kind });
