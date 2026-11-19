import {
  exportTwinfileToLoroMap,
  importTwinfileFromLoroMap,
  type TwinfileLoroMap,
} from '@local-hosting/twinfile/loro';

import type { Character } from '../types/character.js';
import { characterFromJSON, characterToJSON, type CharacterJson } from './json.js';

/** Object-oriented character document with JSON and host LoroMap round-trip. */
export class CharacterBundle {
  readonly #character: Character;

  private constructor(character: Character) {
    this.#character = character;
  }

  static from(character: Character): CharacterBundle {
    return new CharacterBundle(character);
  }

  static fromJSON(json: unknown): CharacterBundle {
    return new CharacterBundle(characterFromJSON(json));
  }

  /** Re-instantiate from a host-passed PackMap / LoroMap-like object. */
  static import(map: TwinfileLoroMap): CharacterBundle {
    return CharacterBundle.fromJSON(importTwinfileFromLoroMap(map));
  }

  get value(): Character {
    return this.#character;
  }

  toJSON(): CharacterJson & Record<string, unknown> {
    return characterToJSON(this.#character) as CharacterJson & Record<string, unknown>;
  }

  /** Write this character onto a host-passed PackMap / LoroMap-like object. */
  export(map: TwinfileLoroMap): void {
    exportTwinfileToLoroMap(map, this.toJSON());
  }
}
