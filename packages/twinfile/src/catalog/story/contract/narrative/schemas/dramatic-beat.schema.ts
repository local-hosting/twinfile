import { z } from 'zod';

import { DRAMATIC_BEAT_IDS } from '../types/dramatic-beat.js';

export const DramaticBeatIdSchema = z.enum(DRAMATIC_BEAT_IDS);

/** Scene placement on the {@link StoryArcTemplate} beat rail. */
export const SceneBeatIdSchema = DramaticBeatIdSchema;
