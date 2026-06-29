import { createHeadTwinTypeModule } from '@local-hosting/twinfile-core';

export const kind = 'character' as const;

export const module = createHeadTwinTypeModule({ kind });
