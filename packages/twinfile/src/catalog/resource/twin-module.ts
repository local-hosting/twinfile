import { createHeadTwinTypeModule } from '@local-hosting/twinfile';

export const kind = 'resource' as const;

export const module = createHeadTwinTypeModule({ kind });
