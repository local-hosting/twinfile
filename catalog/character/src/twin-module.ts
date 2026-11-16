import { createHeadTwinTypeModule } from '@doppler-group/twinfile-core';

export const kind = 'character' as const;

export const module = createHeadTwinTypeModule({ kind });
