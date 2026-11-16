import { isRecord } from '../doc/is-record.js';
import { twinHeadPath } from '../load/twinfile-locator.js';
import type { Result } from '../types/twin-error.js';
import { err, ok } from '../types/twin-error.js';
import type { BuiltTwinHead, TwinHead } from '../types/twin-head.js';
import { TWIN_HEAD_SUFFIX, type TwinKind } from '../types/twin-kind.js';
import type { TwinTypeModule } from '../types/twin-type-module.js';
import { composeHeadUnitDocument } from '../compose/compose-head-unit.js';
import { readTwinHeadYaml } from '../load/load-twin-head-unit.js';
import type { BuildOptions } from '../types/twin-type-module.js';
import { parseTwinHead } from './twin-head.js';

export type HeadTwinTypeModuleOptions = {
  readonly kind: TwinKind;
  /** Accepted `kind:` values; defaults to `[kind]`. */
  readonly kinds?: readonly string[];
  /** Upgrade legacy head fields before the shared check (e.g. `story.beats`). */
  readonly normalize?: (raw: Record<string, unknown>) => Record<string, unknown>;
};

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
    build: async (dir, opts: BuildOptions = {}) => {
      const headPath = twinHeadPath(dir);
      const loaded = readTwinHeadYaml(dir);
      if (!loaded.ok) {
        return err(loaded.errors);
      }
      const raw = loaded.value.doc;
      const needsCompose =
        (typeof raw.from === 'string' && raw.from.trim()) ||
        (Array.isArray(raw.steps) && raw.steps.length > 0) ||
        (Array.isArray(raw.patches) && raw.patches.length > 0);
      let doc = raw;
      if (needsCompose) {
        if (!opts.examplesRoot) {
          return err([
            {
              code: 'E_BUILD',
              message: `${kind} from/steps requires examplesRoot (TF_TWINFILE_ROOT)`,
              file: loaded.value.twinfilePath,
            },
          ]);
        }
        const composed = composeHeadUnitDocument(raw, loaded.value.twinfilePath, {
          examplesRoot: opts.examplesRoot,
        });
        if (!composed.ok) return composed;
        doc = composed.value;
      }
      const head = parseAt(doc, headPath);
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
