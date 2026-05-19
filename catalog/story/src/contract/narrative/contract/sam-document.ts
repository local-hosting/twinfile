import type { SAM } from '../types/sam.js';
import { samFromJSON, samToJSON, type SamJson } from './json.js';

/** Object-oriented SAM document with JSON round-trip. */
export class SamDocument {
  readonly #sam: SAM;

  private constructor(sam: SAM) {
    this.#sam = sam;
  }

  static from(sam: SAM): SamDocument {
    return new SamDocument(sam);
  }

  static fromJSON(json: unknown): SamDocument {
    return new SamDocument(samFromJSON(json));
  }

  get value(): SAM {
    return this.#sam;
  }

  toJSON(): SamJson & Record<string, unknown> {
    return samToJSON(this.#sam) as SamJson & Record<string, unknown>;
  }
}
