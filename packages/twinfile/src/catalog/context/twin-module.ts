import { createHeadTwinTypeModule } from '@local-hosting/twinfile';

export const kind = 'context' as const;

export const module = createHeadTwinTypeModule({ kind });
