import type { PCM } from '../types/pcm.js';
import { pcmFromJSON, pcmToJSON, type PcmJson } from './json.js';

/** Object-oriented PCM document with JSON round-trip. */
export class PcmDocument {
  readonly #pcm: PCM;

  private constructor(pcm: PCM) {
    this.#pcm = pcm;
  }

  static from(pcm: PCM): PcmDocument {
    return new PcmDocument(pcm);
  }

  static fromJSON(json: unknown): PcmDocument {
    return new PcmDocument(pcmFromJSON(json));
  }

  get value(): PCM {
    return this.#pcm;
  }

  toJSON(): PcmJson & Record<string, unknown> {
    return pcmToJSON(this.#pcm) as PcmJson & Record<string, unknown>;
  }
}
