import type { CharacterStoryInstance } from '../types/story/character-story-instance.js';

function parseInstance(json: unknown): CharacterStoryInstance {
  if (!json || typeof json !== 'object') {
    throw new Error('CharacterStoryInstanceDocument.fromJSON expects an object');
  }
  const row = json as CharacterStoryInstance;
  if (row.specVersion !== '1.0') {
    throw new Error('CharacterStoryInstanceDocument requires specVersion 1.0');
  }
  if (!row.characterId?.trim() || !row.segmentId?.trim() || !row.displayName?.trim()) {
    throw new Error('CharacterStoryInstanceDocument missing characterId, segmentId, or displayName');
  }
  return {
    specVersion: '1.0',
    characterId: row.characterId.trim(),
    segmentId: row.segmentId.trim(),
    displayName: row.displayName.trim(),
    characteristics: { ...(row.characteristics ?? {}) },
    createdAt: row.createdAt?.trim() || new Date().toISOString(),
    ...(row.instanceId?.trim() ? { instanceId: row.instanceId.trim() } : {}),
  };
}

/** Runtime Character instance for one story. */
export class CharacterStoryInstanceDocument {
  readonly #instance: CharacterStoryInstance;

  private constructor(instance: CharacterStoryInstance) {
    this.#instance = instance;
  }

  static from(instance: CharacterStoryInstance): CharacterStoryInstanceDocument {
    return new CharacterStoryInstanceDocument(parseInstance(instance));
  }

  static fromJSON(json: unknown): CharacterStoryInstanceDocument {
    return new CharacterStoryInstanceDocument(parseInstance(json));
  }

  get value(): CharacterStoryInstance {
    return this.#instance;
  }

  toJSON(): CharacterStoryInstance {
    return JSON.parse(JSON.stringify(this.#instance)) as CharacterStoryInstance;
  }
}
