import type { PcmStoryInstance } from '../types/story/pcm-story-instance.js';

function parseInstance(json: unknown): PcmStoryInstance {
  if (!json || typeof json !== 'object') {
    throw new Error('PcmStoryInstanceDocument.fromJSON expects an object');
  }
  const row = json as PcmStoryInstance;
  if (row.specVersion !== '1.0') {
    throw new Error('PcmStoryInstanceDocument requires specVersion 1.0');
  }
  if (!row.pcmId?.trim() || !row.segmentId?.trim() || !row.displayName?.trim()) {
    throw new Error('PcmStoryInstanceDocument missing pcmId, segmentId, or displayName');
  }
  return {
    specVersion: '1.0',
    pcmId: row.pcmId.trim(),
    segmentId: row.segmentId.trim(),
    displayName: row.displayName.trim(),
    characteristics: { ...(row.characteristics ?? {}) },
    createdAt: row.createdAt?.trim() || new Date().toISOString(),
    ...(row.instanceId?.trim() ? { instanceId: row.instanceId.trim() } : {}),
  };
}

/** Runtime PCM instance for one story. */
export class PcmStoryInstanceDocument {
  readonly #instance: PcmStoryInstance;

  private constructor(instance: PcmStoryInstance) {
    this.#instance = instance;
  }

  static from(instance: PcmStoryInstance): PcmStoryInstanceDocument {
    return new PcmStoryInstanceDocument(parseInstance(instance));
  }

  static fromJSON(json: unknown): PcmStoryInstanceDocument {
    return new PcmStoryInstanceDocument(parseInstance(json));
  }

  get value(): PcmStoryInstance {
    return this.#instance;
  }

  toJSON(): PcmStoryInstance {
    return JSON.parse(JSON.stringify(this.#instance)) as PcmStoryInstance;
  }
}
