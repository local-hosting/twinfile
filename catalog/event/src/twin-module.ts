import { createHeadTwinTypeModule } from '@local-hosting/twinfile-core';

export const kind = 'event' as const;

export const module = createHeadTwinTypeModule({ kind });
