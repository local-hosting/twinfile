import { createHeadTwinTypeModule } from '@doppler-group/twinfile-core';

export const kind = 'context' as const;

export const module = createHeadTwinTypeModule({ kind });
