import type { Journey } from '@doppler-group/twinfile-character/pcm';

import type { SAM } from '../types/sam.js';
import type { StoryScene } from '../types/scene.js';
import { findJourneyTouchpointBinding } from './journey-touchpoint-binding.js';
import { humanizeStoryWireLabel } from './storyboard-scene-context.js';

function resolveVenueLabelFromSam(sam: SAM | undefined, venueKey: string | undefined): string | undefined {
  const id = venueKey?.trim();
  if (!id) return undefined;
  const venue = sam?.venues?.find((row) => row.venueKey?.trim() === id);
  if (venue?.label?.trim()) return venue.label.trim();
  return humanizeStoryWireLabel(id);
}

function journeyNarrativeText(journey: Journey | undefined): string {
  if (!journey) return '';
  return [journey.journeyGoal, journey.label, journey.id].filter(Boolean).join(' ');
}

function isCommuteShapedJourney(journey: Journey | undefined): boolean {
  const text = journeyNarrativeText(journey);
  return /commute|work on time|to work|morning ride|pickup/i.test(text);
}

function isAirportVenueLabel(label: string): boolean {
  return /airport/i.test(label);
}

function journeyMentionsAirport(journey: Journey | undefined): boolean {
  const text = journeyNarrativeText(journey);
  return /airport|flight|terminal|arriv(?:al|ing)/i.test(text);
}

/**
 * Human place name for reader copy — corrects demo mounts (e.g. airport place on a commute journey).
 */
export function resolveVenueLabelForNarrative(args: {
  sam?: SAM;
  venueKey?: string;
  journey?: Journey;
  touchpointId?: string;
}): string | undefined {
  const raw = resolveVenueLabelFromSam(args.sam, args.venueKey);
  if (!raw) return undefined;

  if (
    isCommuteShapedJourney(args.journey) &&
    isAirportVenueLabel(raw) &&
    !journeyMentionsAirport(args.journey)
  ) {
    const tp = args.touchpointId?.toLowerCase() ?? '';
    if (tp.includes('live-map') || tp.includes('in-ride')) {
      return 'On the commute';
    }
    return 'Curbside pickup';
  }

  return raw;
}

export function resolveScenePlaceForReader(args: {
  touchpointId: string;
  sam?: SAM;
  samScene?: StoryScene;
  journey?: Journey;
  slugline?: string;
}): string {
  const touchpointId = args.touchpointId.trim();
  const key = touchpointId.toLowerCase();
  const binding = args.journey
    ? findJourneyTouchpointBinding(args.journey, touchpointId)
    : undefined;
  const phaseLabel = binding?.phase.label?.trim();

  const venue = resolveVenueLabelForNarrative({
    sam: args.sam,
    venueKey: args.samScene?.venueKey,
    journey: args.journey,
    touchpointId,
  });

  if (key.includes('open-home') || key.includes('at-home')) {
    return venue ? `At home (${venue})` : 'At home';
  }
  if (key.includes('set-dest') || key.includes('choose-dest') || key.includes('confirm-dest')) {
    return 'At home, finishing the ride request';
  }
  if (key.includes('live-map') || key.includes('in-ride')) {
    if (phaseLabel) {
      return `${phaseLabel} — tracking pickup and ETA on the live map`;
    }
    return 'On the commute, tracking pickup and ETA on the live map';
  }
  if (args.samScene?.label?.trim()) {
    return args.samScene.label.trim();
  }
  if (phaseLabel) return phaseLabel;
  if (venue) return venue;

  const slug = args.slugline?.trim();
  if (slug && !slug.includes('UNDEFINED')) {
    return slug.replace(/^INT\.\s*/i, '').replace(/^EXT\.\s*/i, '').replace(/\s*—.*$/, '').trim();
  }

  return humanizeStoryWireLabel(touchpointId) || 'The next beat';
}

/** Strip production alternates (“A or B”) from text used in reader-facing paragraphs. */
export function sanitizeReaderProductionPhrase(text: string): string {
  return text
    .replace(/\s*;\s*glass, steel, traffic layers/gi, '')
    .replace(/\bIn-vehicle or sidewalk\b/gi, 'On the commute')
    .replace(/\s+/g, ' ')
    .trim();
}
