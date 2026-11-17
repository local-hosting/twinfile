import type { Job } from '@doppler-group/twinfile-context';
import type { Character } from '@doppler-group/twinfile-character/character';

import type { Story } from '../types/story-narrative.js';

/** One character twin on a project catalog (host assigns pack ids). */
export type ProjectTwinCharacterRow = {
  character: Character;
  characterId: string;
  projectCharacterId?: string;
};

/** One Story twin on a project catalog. */
export type ProjectTwinStoryRow = {
  story: Story;
  storyId?: string;
};

/** Character + Story bodies available for compose (locker-agnostic). */
export type ProjectTwinCatalog = {
  characters: readonly Character[];
  stories: readonly Story[];
};

/** Read-only twin catalog (hosts implement via pack I/O). */
export type ProjectTwinCatalogSource = {
  getCharacters(): ProjectTwinCharacterRow[];
  getStories(): ProjectTwinStoryRow[];
  getCharacter(characterId: string): ProjectTwinCharacterRow;
  getStory(storyId: string): ProjectTwinStoryRow;
  getJobs(): Job[];
};

export function projectTwinCatalogFromSource(source: ProjectTwinCatalogSource): ProjectTwinCatalog {
  return {
    characters: source.getCharacters().map((row) => row.character),
    stories: source.getStories().map((row) => row.story),
  };
}