import { statSync } from 'node:fs';
import { join } from 'node:path';

import { isRecord } from '../doc/is-record.js';
import { findTwinfileYamlPath } from '../load/twinfile-locator.js';
import { TWIN_CATALOG_TYPES } from '../paths/catalog-layout.js';
import { RUN_PRESET_NAMES, type TwinKind } from '../types/twin-kind.js';
import type { Result, TwinError } from '../types/twin-error.js';
import { err, ok } from '../types/twin-error.js';
import type { TwinHead, TwinHeadPath } from '../types/twin-head.js';
import { readYamlDocument } from '../validate/validate-yaml.js';

export type ParseTwinHeadOptions = {
  readonly headFile: string;
  /** Accepted `kind:` values. */
  readonly kinds: readonly string[];
};

function headErrors(raw: Record<string, unknown>, opts: ParseTwinHeadOptions): TwinError[] {
  const messages: string[] = [];
  if (typeof raw.kind !== 'string' || !opts.kinds.includes(raw.kind)) {
    messages.push(`kind must be ${opts.kinds.join(' | ')}`);
  }
  if (typeof raw.id !== 'string' || !raw.id.trim()) messages.push('id is required');
  if (raw.name !== undefined && typeof raw.name !== 'string') messages.push('name must be a string');
  if (raw.links !== undefined && !Array.isArray(raw.links)) messages.push('links must be a list');
  return messages.map((message) => ({ code: 'E_SCHEMA', message, file: opts.headFile }));
}

/** Common head fields for every twin type; type-specific fields stay with the type module. */
export function parseTwinHead(raw: unknown, opts: ParseTwinHeadOptions): Result<TwinHead> {
  if (!isRecord(raw)) return err([{ code: 'E_SCHEMA', message: 'expected object', file: opts.headFile }]);
  const errors = headErrors(raw, opts);
  return errors.length > 0 ? err(errors) : ok(raw as TwinHead);
}

function twinKindOf(declared: unknown): TwinKind | undefined {
  return TWIN_CATALOG_TYPES.find((kind) => kind === declared);
}

/** Unit head in `dir` (`<dir>/<dir>.twin.yaml`), typed by its `kind:` field. */
export function findTwinHead(dir: string): TwinHeadPath | undefined {
  const path = findTwinfileYamlPath(dir);
  if (!path) return undefined;
  const { value } = readYamlDocument(path);
  const kind = twinKindOf(isRecord(value) ? value.kind : undefined);
  return kind ? { kind, path } : undefined;
}

/** Publishable unit folder: a twin head or a scene run head. */
export function isTwinUnitDir(dir: string): boolean {
  if (findTwinfileYamlPath(dir)) return true;
  return RUN_PRESET_NAMES.some((name) => statSync(join(dir, name), { throwIfNoEntry: false })?.isFile());
}
