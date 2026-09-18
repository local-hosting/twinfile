import type { Journey } from '@local-hosting/twinfile-character/character';
import { requireJourneyById } from '@local-hosting/twinfile-character/character';

import type { Story } from '../../types/story-narrative.js';

export function resolveJourneyForStory(story: Story, journeys: readonly Journey[]): Journey {
  return requireJourneyById(journeys, story.binding.journeyId.trim());
}
