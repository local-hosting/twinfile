import { createHeadTwinTypeModule } from '@local-hosting/twinfile-core';

export const headFile = 'Character.yaml';
export const kind = 'character' as const;

export const module = createHeadTwinTypeModule({ kind, headFile });
