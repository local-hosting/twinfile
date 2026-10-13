import { assertSupportedTwinfileVersion, TWINFILE_FORMAT_VERSION } from '../types/twinfile-spec.js';

export type TwinfileHead = Record<string, unknown> & {
  twinfile: number;
  kind: string;
  name: string;
  version: string;
};

/** Immutable wrapper for a parsed Twinfile. */
export class TwinfileDocument {
  readonly #twinfile: TwinfileHead;

  private constructor(twinfile: TwinfileHead) {
    this.#twinfile = twinfile;
  }

  static from(twinfile: TwinfileHead): TwinfileDocument {
    assertSupportedTwinfileVersion(twinfile.twinfile);
    return new TwinfileDocument(twinfile);
  }

  static fromJSON(json: unknown): TwinfileDocument {
    if (!json || typeof json !== 'object') {
      throw new Error('TwinfileDocument.fromJSON: expected object');
    }
    return TwinfileDocument.from(json as TwinfileHead);
  }

  get value(): TwinfileHead {
    return this.#twinfile;
  }

  get specVersion(): typeof TWINFILE_FORMAT_VERSION {
    return TWINFILE_FORMAT_VERSION;
  }

  toJSON(): TwinfileHead {
    return { ...this.#twinfile };
  }
}
