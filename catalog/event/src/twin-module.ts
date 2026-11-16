import { createHeadTwinTypeModule } from '@doppler-group/twinfile-core';

export const kind = 'event' as const;

export const module = createHeadTwinTypeModule({ kind });
