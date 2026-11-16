import { createHeadTwinTypeModule } from '@doppler-group/twinfile-core';

export const headFile = 'Character.yaml';
export const kind = 'character' as const;

export const module = createHeadTwinTypeModule({ kind, headFile });
