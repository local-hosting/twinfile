import type { Journey, Character } from '@local-hosting/twinfile-character/persona';

/**
 * Character-first compile input — stories anchor on Character twins, not psychographic segments.
 * Hosts pass mounted Character documents; Story resolves journeys and touchpoint order from the character spine.
 */
export type StoryCharacterContext = {
  /** Focal character — must match `story.binding.characterId`. */
  focalCharacterId: string;
  /** When set, touchpoint sequence comes from this journey on the focal Character. */
  journeyId?: string;
  /** Pre-resolved journey (overrides `journeyId` lookup). */
  journey?: Journey;
  /** Mounted Characters by document id (`persona:rider` character root id). */
  characterById?: Readonly<Record<string, Character>>;
  journeyPace?: string;
};
