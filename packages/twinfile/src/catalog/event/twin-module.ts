import { createHeadTwinTypeModule } from '@local-hosting/twinfile';

export const kind = 'event' as const;

export const module = createHeadTwinTypeModule({ kind });
