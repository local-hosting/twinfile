import { statSync, writeFileSync } from 'node:fs';

import type { BuildLayerResult } from '../types/build-layer.js';
import type { Result, TwinError } from '../types/twin-error.js';
import { err, ok } from '../types/twin-error.js';
import { TWIN_LOCK_SUFFIX, type TwinfileLockDocument } from '../types/twinfile-lock.js';
import { twinLockPath } from '../load/twinfile-locator.js';
import { ajvErrorsToTwinErrors, type TwinValidator } from '../validate/create-validator.js';
import { getDefaultValidator, readYamlDocument, type ParsedYamlFile } from '../validate/validate-yaml.js';

export type { TwinfileLockDocument } from '../types/twinfile-lock.js';
export { lockRefKeyFromTwinfile } from '../types/twinfile-lock.js';

export function readTwinfileLock(unitRoot: string): Result<TwinfileLockDocument | undefined> {
  const path = twinLockPath(unitRoot);
  if (!statSync(path, { throwIfNoEntry: false })?.isFile()) {
    return ok(undefined);
  }
  const parsed = readYamlDocument(path);
  return validateLockDocument(getDefaultValidator(), parsed);
}

export function validateLockDocument(
  validator: TwinValidator,
  parsed: ParsedYamlFile,
): Result<TwinfileLockDocument> {
  const valid = validator.validateLock(parsed.value);
  if (!valid) {
    return err(ajvErrorsToTwinErrors(parsed.path, parsed.doc, validator.validateLock.errors));
  }
  return ok(parsed.value as TwinfileLockDocument);
}

export type LockVerifyInput = {
  refKey: string;
  manifestDigest: string;
  treeDigest: string;
  layerChains: string[];
  manifestVersion: string;
};

export function verifyLockEntry(
  lock: TwinfileLockDocument,
  input: LockVerifyInput,
): TwinError[] {
  const entry = lock.refs[input.refKey];
  if (!entry) {
    return [
      {
        code: 'E_LOCK_DRIFT',
        message: `Lock missing ref "${input.refKey}"`,
        file: TWIN_LOCK_SUFFIX,
      },
    ];
  }

  const errors: TwinError[] = [];
  if (entry.version !== input.manifestVersion) {
    errors.push({
      code: 'E_LOCK_DRIFT',
      message: `Lock version ${entry.version} != manifest ${input.manifestVersion}`,
      file: TWIN_LOCK_SUFFIX,
    });
  }
  if (entry.manifest && entry.manifest !== input.manifestDigest) {
    errors.push({
      code: 'E_LOCK_DRIFT',
      message: 'Twinfile digest does not match lock',
      file: TWIN_LOCK_SUFFIX,
      hint: `expected ${entry.manifest}, got ${input.manifestDigest}`,
    });
  }
  if (entry.tree && entry.tree !== input.treeDigest) {
    errors.push({
      code: 'E_LOCK_DRIFT',
      message: 'Tree digest does not match lock',
      file: TWIN_LOCK_SUFFIX,
    });
  }
  if (entry.layers) {
    if (entry.layers.length !== input.layerChains.length) {
      errors.push({
        code: 'E_LOCK_DRIFT',
        message: `Layer chain count ${input.layerChains.length} != lock ${entry.layers.length}`,
        file: TWIN_LOCK_SUFFIX,
      });
    } else {
      for (let i = 0; i < entry.layers.length; i += 1) {
        if (entry.layers[i] !== input.layerChains[i]) {
          errors.push({
            code: 'E_LOCK_DRIFT',
            message: `Layer chain mismatch at index ${i}`,
            file: TWIN_LOCK_SUFFIX,
          });
          break;
        }
      }
    }
  }
  return errors;
}

export function mergeLockEntry(
  lock: TwinfileLockDocument | undefined,
  refKey: string,
  entry: {
    version: string;
    twinfile: string;
    tree: string;
    layers: string[];
  },
): TwinfileLockDocument {
  const base: TwinfileLockDocument = lock ?? { twinfile: 1, refs: {} };
  return {
    twinfile: 1,
    refs: {
      ...base.refs,
      [refKey]: entry,
    },
    meta: base.meta,
  };
}

export function writeTwinfileLock(unitRoot: string, lock: TwinfileLockDocument): void {
  const path = twinLockPath(unitRoot);
  writeFileSync(path, `${JSON.stringify(lock, null, 2)}\n`, 'utf8');
}

export type { BuildLayerResult };
