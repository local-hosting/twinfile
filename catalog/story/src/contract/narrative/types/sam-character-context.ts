import type { Journey, PCM } from '@local-hosting/twinfile-character/pcm';

/**
 * Character-first compile input — stories anchor on PCM twins, not psychographic segments.
 * Hosts pass mounted PCM documents; SAM resolves journeys and touchpoint order from the character spine.
 */
export type SAMCharacterContext = {
  /** Focal character — must match `sam.binding.pcmId`. */
  focalPcmId: string;
  /** When set, touchpoint sequence comes from this journey on the focal PCM. */
  journeyId?: string;
  /** Pre-resolved journey (overrides `journeyId` lookup). */
  journey?: Journey;
  /** Mounted PCMs by document id (`persona:rider` pcm root id). */
  pcmById?: Readonly<Record<string, PCM>>;
  journeyPace?: string;
};
