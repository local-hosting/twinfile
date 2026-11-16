import type { Journey } from '@local-hosting/twinfile-character/pcm';
import { requireJourneyById } from '@local-hosting/twinfile-character/pcm';

import type { SAM } from '../../types/sam.js';

export function resolveJourneyForSam(sam: SAM, journeys: readonly Journey[]): Journey {
  return requireJourneyById(journeys, sam.binding.journeyId.trim());
}
