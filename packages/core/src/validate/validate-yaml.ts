import { readFileSync } from 'node:fs';

import { Document, parseDocument } from 'yaml';

import type { Result } from '../types/twin-error.js';
import { err, ok } from '../types/twin-error.js';

import {
  ajvErrorsToTwinErrors,
  createTwinValidator,
  schemaIdForPlaceLayerDocument,
  type TwinValidator,
} from './create-validator.js';

export type ParsedYamlFile = {
  path: string;
  doc: Document;
  value: unknown;
};

export function readYamlDocument(path: string): ParsedYamlFile {
  const raw = readFileSync(path, 'utf8');
  const doc = parseDocument(raw, { keepSourceTokens: true });
  return { path, doc, value: doc.toJSON() };
}

/** Wrap an inline value (e.g. one `steps:` item) so file validators can report against it. */
export function inlineYamlDocument(path: string, value: unknown): ParsedYamlFile {
  return { path, doc: new Document(value), value };
}

export function validateTwinfileFile(
  validator: TwinValidator,
  parsed: ParsedYamlFile,
): Result<Record<string, unknown>> {
  const valid = validator.validateTwinfile(parsed.value);
  if (!valid) {
    return err(ajvErrorsToTwinErrors(parsed.path, parsed.doc, validator.validateTwinfile.errors));
  }
  if (parsed.value === null || typeof parsed.value !== 'object' || Array.isArray(parsed.value)) {
    return err([
      {
        code: 'E_SCHEMA',
        message: 'Manifest must be a YAML mapping',
        file: parsed.path,
      },
    ]);
  }
  return ok(parsed.value as Record<string, unknown>);
}

const PLAN_SCHEMA_ID = 'https://twinfile.org/schemas/1/run/plan.schema.json';

export const PLACE_TYPE_SCHEMA_ID = 'https://twinfile.org/schemas/1/place/place-type.schema.json';

export function validatePlaceTypeValue(
  validator: TwinValidator,
  value: unknown,
  fileHint = 'Place.meta.placeType',
): Result<Record<string, unknown>> {
  const fn = validator.getSchema(PLACE_TYPE_SCHEMA_ID);
  if (!fn) {
    return err([{ code: 'E_SCHEMA', message: 'Place type schema not registered', file: fileHint }]);
  }
  const valid = fn(value);
  if (!valid) {
    return err(ajvErrorsToTwinErrors(fileHint, undefined, fn.errors));
  }
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return err([{ code: 'E_SCHEMA', message: 'placeType must be an object', file: fileHint }]);
  }
  return ok(value as Record<string, unknown>);
}

export function validatePlanFile(
  validator: TwinValidator,
  parsed: ParsedYamlFile,
): Result<Record<string, unknown>> {
  const fn = validator.getSchema(PLAN_SCHEMA_ID);
  if (!fn) {
    return err([{ code: 'E_SCHEMA', message: 'Plan schema not registered', file: parsed.path }]);
  }
  const valid = fn(parsed.value);
  if (!valid) {
    return err(ajvErrorsToTwinErrors(parsed.path, parsed.doc, fn.errors));
  }
  if (parsed.value === null || typeof parsed.value !== 'object' || Array.isArray(parsed.value)) {
    return err([{ code: 'E_SCHEMA', message: 'Plan must be a mapping', file: parsed.path }]);
  }
  return ok(parsed.value as Record<string, unknown>);
}

export function validatePlaceLayerFile(
  validator: TwinValidator,
  parsed: ParsedYamlFile,
): Result<unknown> {
  const schemaId = schemaIdForPlaceLayerDocument(parsed.value);
  if (!schemaId) {
    const keys =
      parsed.value !== null && typeof parsed.value === 'object' && !Array.isArray(parsed.value)
        ? Object.keys(parsed.value)
        : [];
    return err([
      {
        code: 'E_SCHEMA',
        message:
          keys.length === 0
            ? 'Graph layer file must have exactly one top-level collection key'
            : `Unknown place layer collection key: ${keys.join(', ')}`,
        file: parsed.path,
      },
    ]);
  }
  const fn = validator.getSchema(schemaId);
  if (!fn) {
    return err([
      {
        code: 'E_SCHEMA',
        message: `No schema registered for ${schemaId}`,
        file: parsed.path,
      },
    ]);
  }
  const valid = fn(parsed.value);
  if (!valid) {
    return err(ajvErrorsToTwinErrors(parsed.path, parsed.doc, fn.errors));
  }
  return ok(parsed.value);
}

let defaultValidator: TwinValidator | undefined;

export function getDefaultValidator(): TwinValidator {
  defaultValidator ??= createTwinValidator();
  return defaultValidator;
}

export function validateDocumentAtPath(path: string, schemaId: string): Result<unknown> {
  const validator = getDefaultValidator();
  const parsed = readYamlDocument(path);
  const fn = validator.getSchema(schemaId);
  if (!fn) {
    return err([{ code: 'E_SCHEMA', message: `Unknown schema ${schemaId}`, file: path }]);
  }
  const valid = fn(parsed.value);
  if (!valid) {
    return err(ajvErrorsToTwinErrors(path, parsed.doc, fn.errors));
  }
  return ok(parsed.value);
}
