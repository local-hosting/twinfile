import type { Result } from './twin-error.js';
import type { TwinKind } from './twin-kind.js';

export type { TwinKind };

export type BuildOptions = {
  readonly frozen?: boolean;
  readonly writeLock?: boolean;
  readonly examplesRoot?: string;
};

export type TwinTypeModule<TDoc, TBuilt> = {
  readonly kind: TwinKind;
  parse(raw: unknown): Result<TDoc>;
  validate(doc: TDoc): Result<TDoc>;
  build(dir: string, opts: BuildOptions): Promise<Result<TBuilt>>;
  toJSON(built: TBuilt): Record<string, unknown>;
  fromJSON(json: unknown): Result<TBuilt>;
};

export type AnyTwinTypeModule = TwinTypeModule<unknown, unknown>;

export type TwinTypeRegistry = {
  getOne(kind: TwinKind): Result<AnyTwinTypeModule>;
  getAll(): readonly AnyTwinTypeModule[];
};
