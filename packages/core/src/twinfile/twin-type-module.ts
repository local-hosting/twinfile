import { statSync } from 'node:fs';
import { join } from 'node:path';

import { isRecord } from '../doc/is-record.js';
import type { Result } from '../types/twin-error.js';
import { err, ok } from '../types/twin-error.js';
import type { BuiltTwinHead, TwinHead } from '../types/twin-head.js';
import type { TwinKind } from '../types/twin-kind.js';
import type { TwinTypeModule } from '../types/twin-type-module.js';
import { readYamlDocument } from '../validate/validate-yaml.js';
import { parseTwinHead } from './twin-head.js';

export type HeadTwinTypeModuleOptions = {
  readonly kind: TwinKind;
  readonly headFile: string;
  /** Accepted `kind:` values; defaults to `[kind]`. */
  readonly kinds?: readonly string[];
  /** Upgrade legacy head fields before the shared check (e.g. `story.beats`). */
  readonly normalize?: (raw: Record<string, unknown>) => Record<string, unknown>;
};

function readHead(path: string, parse: (raw: unknown) => Result<TwinHead>): Result<TwinHead> {
  if (!statSync(path, { throwIfNoEntry: false })?.isFile()) {
    return err([{ code: 'E_MISSING_FILE', message: 'missing twin head', file: path }]);
  }
  const { doc, value } = readYamlDocument(path);
  if (doc.errors.length > 0) {
    return err(doc.errors.map((error) => ({ code: 'E_SCHEMA', message: error.message, file: path })));
  }
  return parse(value);
}

/** Twin type module backed by the shared head check; type packages add their own build over time. */
export function createHeadTwinTypeModule(
  opts: HeadTwinTypeModuleOptions,
): TwinTypeModule<TwinHead, BuiltTwinHead> {
  const { kind, headFile, normalize } = opts;
  const headOpts = { headFile, kinds: opts.kinds ?? [kind] };
  const parse = (raw: unknown): Result<TwinHead> =>
    parseTwinHead(isRecord(raw) && normalize ? normalize(raw) : raw, headOpts);

  return {
    kind,
    headFile,
    parse,
    validate: (doc) => ok(doc),
    build: async (dir) => {
      const head = readHead(join(dir, headFile), parse);
      return head.ok ? ok({ kind, dir, head: head.value }) : head;
    },
    toJSON: (built) => ({ ...built }),
    fromJSON: (json) => {
      if (!isRecord(json) || json.kind !== kind || typeof json.dir !== 'string') {
        return err([{ code: 'E_SCHEMA', message: `expected built ${kind} twin`, file: headFile }]);
      }
      const head = parse(json.head);
      return head.ok ? ok({ kind, dir: json.dir, head: head.value }) : head;
    },
  };
}
