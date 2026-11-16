import type { Journey } from '@doppler-group/twinfile-character/persona';
import { requireJourneyById } from '@doppler-group/twinfile-character/persona';

import type { Story } from '../../types/story-narrative.js';

export function resolveJourneyForStory(story: Story, journeys: readonly Journey[]): Journey {
  return requireJourneyById(journeys, story.binding.journeyId.trim());
}
