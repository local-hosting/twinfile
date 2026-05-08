import { statSync } from 'node:fs';
import { join } from 'node:path';

import { isRecord } from '../doc/is-record.js';
import { PLACE_HEAD_NAMES } from '../load/twinfile-locator.js';
import type { Result, TwinError } from '../types/twin-error.js';
import { err, ok } from '../types/twin-error.js';
import type { TwinHead, TwinHeadPath } from '../types/twin-head.js';
import { TWIN_HEAD_FILES, type TwinKind } from '../types/twin-kind.js';

export type ParseTwinHeadOptions = {
  readonly headFile: string;
  /** Accepted `kind:` values — place heads also accept `mixin`. */
  readonly kinds: readonly string[];
};

const HEAD_NAMES_BY_KIND: Record<TwinKind, readonly string[]> = {
  place: PLACE_HEAD_NAMES,
  resource: [TWIN_HEAD_FILES.resource],
  character: [TWIN_HEAD_FILES.character],
  story: [TWIN_HEAD_FILES.story],
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

/** First twin head in `dir` (place includes legacy `Twinfile.yaml`). */
export function findTwinHead(dir: string): TwinHeadPath | undefined {
  for (const kind of Object.keys(HEAD_NAMES_BY_KIND) as TwinKind[]) {
    for (const name of HEAD_NAMES_BY_KIND[kind]) {
      const path = join(dir, name);
      if (statSync(path, { throwIfNoEntry: false })?.isFile()) return { kind, path };
    }
  }
  return undefined;
}
