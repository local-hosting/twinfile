import { statSync } from 'node:fs';

import { isRecord } from '../doc/is-record.js';
import { twinHeadPath } from '../load/twinfile-locator.js';
import type { Result } from '../types/twin-error.js';
import { err, ok } from '../types/twin-error.js';
import type { BuiltTwinHead, TwinHead } from '../types/twin-head.js';
import { TWIN_HEAD_SUFFIX, type TwinKind } from '../types/twin-kind.js';
import type { TwinTypeModule } from '../types/twin-type-module.js';
import { readYamlDocument } from '../validate/validate-yaml.js';
import { parseTwinHead } from './twin-head.js';

export type HeadTwinTypeModuleOptions = {
  readonly kind: TwinKind;
  /** Accepted `kind:` values; defaults to `[kind]`. */
  readonly kinds?: readonly string[];
  /** Upgrade legacy head fields before the shared check (e.g. `story.beats`). */
  readonly normalize?: (raw: Record<string, unknown>) => Record<string, unknown>;
};

function readHead(path: string, parse: (raw: unknown, file: string) => Result<TwinHead>): Result<TwinHead> {
  if (!statSync(path, { throwIfNoEntry: false })?.isFile()) {
    return err([{ code: 'E_MISSING_FILE', message: 'missing twin head', file: path }]);
  }
  const { doc, value } = readYamlDocument(path);
  if (doc.errors.length > 0) {
    return err(doc.errors.map((error) => ({ code: 'E_SCHEMA', message: error.message, file: path })));
  }
  return parse(value, path);
}

/** Twin type module backed by the shared head check; type packages add their own build over time. */
export function createHeadTwinTypeModule(
  opts: HeadTwinTypeModuleOptions,
): TwinTypeModule<TwinHead, BuiltTwinHead> {
  const { kind, normalize } = opts;
  const kinds = opts.kinds ?? [kind];
  const parseAt = (raw: unknown, headFile: string): Result<TwinHead> =>
    parseTwinHead(isRecord(raw) && normalize ? normalize(raw) : raw, { headFile, kinds });
  const parse = (raw: unknown): Result<TwinHead> => parseAt(raw, TWIN_HEAD_SUFFIX);

  return {
    kind,
    parse,
    validate: (doc) => ok(doc),
    build: async (dir) => {
      const head = readHead(twinHeadPath(dir), parseAt);
      return head.ok ? ok({ kind, dir, head: head.value }) : head;
    },
    toJSON: (built) => ({ ...built }),
    fromJSON: (json) => {
      if (!isRecord(json) || json.kind !== kind || typeof json.dir !== 'string') {
        return err([{ code: 'E_SCHEMA', message: `expected built ${kind} twin`, file: TWIN_HEAD_SUFFIX }]);
      }
      const head = parse(json.head);
      return head.ok ? ok({ kind, dir: json.dir, head: head.value }) : head;
    },
  };
}
