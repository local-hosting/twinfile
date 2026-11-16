import type { TwinKind } from './twin-kind.js';

/** Fields every published twin head (`<unit>/<unit>.twin.yaml`) shares. */
export type TwinHead = Record<string, unknown> & {
  readonly kind: string;
  readonly id: string;
  readonly name?: string;
  readonly links?: readonly unknown[];
};

/** Build output for twin types without a type-specific build yet. */
export type BuiltTwinHead = {
  readonly kind: TwinKind;
  readonly dir: string;
  readonly head: TwinHead;
};

/** Head file found in a unit directory. */
export type TwinHeadPath = {
  readonly kind: TwinKind;
  readonly path: string;
};
