import { z } from 'zod';

import { STORY_ARC_KINDS } from '../types/story-arc-kind.js';

export const StoryArcKindSchema = z.enum(STORY_ARC_KINDS);
