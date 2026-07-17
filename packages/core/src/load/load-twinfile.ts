import { readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

import type { Result, TwinError } from '../types/twin-error.js';
import { err, ok } from '../types/twin-error.js';
import { isRecord } from '../doc/is-record.js';

import { isAllowedTwinfileRootEntry } from './twinfile-allowlist.js';
import { findTwinfileYamlPath, twinHeadFileName } from './twinfile-locator.js';
import { checkCatalogParent } from '../check/catalog-parent.js';
import {
  getDefaultValidator,
  inlineYamlDocument,
  readYamlDocument,
  validateTwinfileFile,
  validatePlanFile,
  validatePlaceLayerFile,
} from '../validate/validate-yaml.js';
import type { TwinValidator } from '../validate/create-validator.js';
import { twinfileStepItems, normalizeComposeTwinfileKeys } from './twinfile-compose.js';
import { twinfilePlaceLayerPaths, twinfileBindingPaths } from './twinfile-paths.js';
import { isPatchesTwinfile } from './twinfile-instructions.js';
import { TWINFILE_UNIT_ROLE } from './twinfile-unit-role.js';
import { copyRefAlternates } from './copy-ref-alternates.js';
import { checkPlaceArchetypeOnLoad } from './place-load-hooks.js';
export type LoadedTwinfile = {
  root: string;
  twinfilePath: string;
  twinfile: Record<string, unknown>;
};

function collectUnknownRootEntries(root: string): TwinError[] {
  const errors: TwinError[] = [];
  for (const name of readdirSync(root)) {
    if (name.startsWith('.')) continue;
    if (isAllowedTwinfileRootEntry(name, root)) continue;
    errors.push({
      code: 'E_UNKNOWN_FILE',
      message: `Unknown top-level entry "${name}" (move under ext/ or remove)`,
      file: join(root, name),
    });
  }
  return errors;
}

function validateFile(
  root: string,
  rel: string,
  label: string,
  validate: (parsed: ReturnType<typeof readYamlDocument>) => Result<unknown>,
): TwinError[] {
  const path = join(root, rel);
  if (!statSync(path, { throwIfNoEntry: false })?.isFile()) {
    return [{ code: 'E_MISSING_FILE', message: `${label} file not found: ${rel}`, file: path }];
  }
  const result = validate(readYamlDocument(path));
  return result.ok ? [] : result.errors;
}

/** v1: every `layers:` path (place files and binding yaml) must exist and match its schema. */
function validateLayerFiles(validator: TwinValidator, root: string, twinfile: Record<string, unknown>): TwinError[] {
  return [
    ...twinfilePlaceLayerPaths(twinfile).flatMap((entry) =>
      validateFile(root, entry.path, 'Layer', (parsed) => validatePlaceLayerFile(validator, parsed)),
    ),
    ...twinfileBindingPaths(twinfile).flatMap((rel) =>
      validateFile(root, rel, 'Event binding', (parsed) => validatePlanFile(validator, parsed)),
    ),
  ];
}

/** v2: each inline `steps:` item matches its collection or plan schema; local `copy:` units exist. */
function validateInlinePatches(
  validator: TwinValidator,
  root: string,
  twinfilePath: string,
  twinfile: Record<string, unknown>,
): TwinError[] {
  const items = twinfileStepItems(twinfile) as Record<string, unknown>[];
  return items.flatMap((item, index) => {
    if (typeof item.copy === 'string') {
      const ref = item.copy.trim();
      if (!ref.startsWith('./') && !ref.startsWith('../')) return [];
      const candidates = [ref, ...copyRefAlternates(ref)];
      const found = candidates.some((candidate) => findTwinfileYamlPath(resolve(root, candidate)));
      return found
        ? []
        : [
            {
              code: 'E_MISSING_FILE' as const,
              message: `steps[${index}] copy: no twin head at ${ref}`,
              file: twinfilePath,
            },
          ];
    }
    const { mode: _mode, ...doc } = item;
    const binding =
      isRecord(item) && isRecord(item.bind) ? item.bind : isRecord(item) && isRecord(item.plan) ? item.plan : undefined;
    const parsed = inlineYamlDocument(twinfilePath, binding ?? doc);
    const result = binding ? validatePlanFile(validator, parsed) : validatePlaceLayerFile(validator, parsed);
    return result.ok ? [] : result.errors.map((e) => ({ ...e, message: `steps[${index}]: ${e.message}` }));
  });
}

export function loadTwinfile(unitRoot: string): Result<LoadedTwinfile> {
  const root = resolve(unitRoot);
  if (!statSync(root, { throwIfNoEntry: false })?.isDirectory()) {
    return err([
      {
        code: 'E_MISSING_FILE',
        message: 'Twinfile directory is not a directory',
        file: root,
      },
    ]);
  }

  const unknown = collectUnknownRootEntries(root);
  if (unknown.length > 0) return err(unknown);

  const twinfilePath = findTwinfileYamlPath(root);
  if (!twinfilePath) {
    return err([
      {
        code: 'E_NO_MANIFEST',
        message: `Missing ${twinHeadFileName(root)}`,
        file: root,
      },
    ]);
  }

  const validator = getDefaultValidator();
  const parsed = readYamlDocument(twinfilePath);
  const normalizedValue = normalizeComposeTwinfileKeys(
    parsed.value !== null && typeof parsed.value === 'object' && !Array.isArray(parsed.value)
      ? (parsed.value as Record<string, unknown>)
      : {},
  );

  const normalizedParsed = { ...parsed, value: normalizedValue };
  const validated = validateTwinfileFile(validator, normalizedParsed);
  if (!validated.ok) return validated;

  const twinfile = validated.value;
  const contentErrors = isPatchesTwinfile(twinfile)
    ? validateInlinePatches(validator, root, twinfilePath, twinfile)
    : validateLayerFiles(validator, root, twinfile);
  if (contentErrors.length > 0) return err(contentErrors);

  const layout = checkPlaceArchetypeOnLoad({ root, twinfilePath, twinfile });
  if (!layout.ok) return layout;

  const catalogErrors = checkCatalogParent(root, twinfile);
  if (catalogErrors.length > 0) return err(catalogErrors);

  const declared = String(twinfile.kind ?? '').trim();
  const keepsKind = declared === 'mixin' || declared === 'event';
  if (declared && declared !== TWINFILE_UNIT_ROLE && !keepsKind) {
    return err([
      {
        code: 'E_SCHEMA',
        message:
          declared === 'scenario'
            ? 'Runs use story scene run.yaml — this loader only reads places'
            : `Expected a place or event head (got kind "${declared}"); use a story scene run.yaml`,
        file: twinfilePath,
      },
    ]);
  }

  const normalized = keepsKind ? twinfile : { ...twinfile, kind: TWINFILE_UNIT_ROLE };

  return ok({ root, twinfilePath, twinfile: normalized });
}

export function validateTwinfileYamlPath(twinfilePath: string): Result<Record<string, unknown>> {
  const validator = getDefaultValidator();
  const parsed = readYamlDocument(twinfilePath);
  return validateTwinfileFile(validator, parsed);
}

export function validatePlaceYamlPath(layerPath: string): Result<unknown> {
  const validator = getDefaultValidator();
  const parsed = readYamlDocument(layerPath);
  return validatePlaceLayerFile(validator, parsed);
}
