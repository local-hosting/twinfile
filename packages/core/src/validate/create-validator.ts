import { createRequire } from 'node:module';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';

import Ajv2020Import from 'ajv/dist/2020.js';
import addFormatsImport from 'ajv-formats';
import type { ErrorObject, ValidateFunction } from 'ajv';
import type { Document, Node } from 'yaml';

import type { TwinError } from '../types/twin-error.js';

const require = createRequire(import.meta.url);

function resolveSpecSchemasRoot(): string {
  const fromPackage = join(dirname(require.resolve('@doppler-group/twinfile-spec/package.json')), 'schemas', '1');
  try {
    const corePkg = dirname(require.resolve('@doppler-group/twinfile-core/package.json'));
    const monorepo = join(corePkg, '../spec/schemas/1');
    if (statSync(monorepo, { throwIfNoEntry: false })?.isDirectory()) {
      return monorepo;
    }
  } catch {
    /* standalone @doppler-group/twinfile-core install */
  }
  return fromPackage;
}

const specRoot = resolveSpecSchemasRoot();

const Ajv2020 = Ajv2020Import as unknown as new (options?: object) => {
  addSchema: (schema: object) => unknown;
  getSchema: (key: string) => ValidateFunction | undefined;
};

const addFormats = addFormatsImport as unknown as (ajv: InstanceType<typeof Ajv2020>) => void;

function collectSchemaFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...collectSchemaFiles(p));
    else if (name.endsWith('.schema.json')) out.push(p);
  }
  return out;
}

export type TwinValidator = {
  validateTwinfile: ValidateFunction;
  validateLock: ValidateFunction;
  getSchema: (schemaId: string) => ValidateFunction | undefined;
};

export function createTwinValidator(): TwinValidator {
  const ajv = new Ajv2020({ strict: false, allErrors: true });
  addFormats(ajv);

  ajv.addSchema(JSON.parse(readFileSync(join(specRoot, 'defs.json'), 'utf8')));

  for (const file of collectSchemaFiles(specRoot)) {
    if (file.endsWith('defs.json')) continue;
    ajv.addSchema(JSON.parse(readFileSync(file, 'utf8')));
  }

  const validateTwinfile = ajv.getSchema('https://twinfile.org/schemas/1/twinfile/twinfile.schema.json');
  const validateLock = ajv.getSchema('https://twinfile.org/schemas/1/twinfile/lock.schema.json');
  if (!validateTwinfile || !validateLock) {
    throw new Error('Missing @doppler-group/twinfile-spec Twinfile schemas');
  }

  return {
    validateTwinfile,
    validateLock,
    getSchema(schemaId: string) {
      return ajv.getSchema(schemaId) ?? undefined;
    },
  };
}

export const PLACE_LAYER_ROOT_KEYS: Record<string, string> = {
  place: 'https://twinfile.org/schemas/1/place/place.schema.json',
  spaces: 'https://twinfile.org/schemas/1/place/spaces.schema.json',
  levels: 'https://twinfile.org/schemas/1/place/levels.schema.json',
  openings: 'https://twinfile.org/schemas/1/place/openings.schema.json',
  routes: 'https://twinfile.org/schemas/1/place/routes.schema.json',
  assets: 'https://twinfile.org/schemas/1/place/ops/assets.schema.json',
  services: 'https://twinfile.org/schemas/1/place/ops/services.schema.json',
  sensors: 'https://twinfile.org/schemas/1/place/ops/sensors.schema.json',
  ai: 'https://twinfile.org/schemas/1/place/ops/ai.schema.json',
  reaches: 'https://twinfile.org/schemas/1/place/nat/reaches.schema.json',
  gauges: 'https://twinfile.org/schemas/1/place/nat/gauges.schema.json',
  stations: 'https://twinfile.org/schemas/1/place/nat/stations.schema.json',
  markers: 'https://twinfile.org/schemas/1/place/nat/markers.schema.json',
  visits: 'https://twinfile.org/schemas/1/place/visits.schema.json',
  hours: 'https://twinfile.org/schemas/1/place/meta/hours.schema.json',
  roles: 'https://twinfile.org/schemas/1/place/meta/roles.schema.json',
  policies: 'https://twinfile.org/schemas/1/place/meta/policies.schema.json',
  accessibility: 'https://twinfile.org/schemas/1/place/meta/accessibility.schema.json',
  tracks: 'https://twinfile.org/schemas/1/place/time/tracks.schema.json',
  schedules: 'https://twinfile.org/schemas/1/place/time/schedules.schema.json',
};

export function schemaIdForPlaceLayerDocument(data: unknown): string | undefined {
  if (data === null || typeof data !== 'object' || Array.isArray(data)) return undefined;
  const keys = Object.keys(data);
  if (keys.length !== 1) return undefined;
  const root = keys[0];
  if (!root) return undefined;
  return PLACE_LAYER_ROOT_KEYS[root];
}

function nodeLineCol(node: Node | null | undefined): { line?: number; col?: number } {
  if (!node?.range) return {};
  return { line: node.range[0] + 1, col: 0 };
}

function resolvePathInDocument(doc: Document, instancePath: string): Node | undefined {
  if (!instancePath || instancePath === '/') return doc.contents ?? undefined;
  const segments = instancePath
    .replace(/^\//, '')
    .split('/')
    .filter(Boolean)
    .map((s) => {
      if (/^\d+$/.test(s)) return Number(s);
      return s.replace(/~1/g, '/').replace(/~0/g, '~');
    });
  return doc.getIn(segments, true) as Node | undefined;
}

export function ajvErrorsToTwinErrors(
  file: string,
  doc: Document | undefined,
  errors: ErrorObject[] | null | undefined,
): TwinError[] {
  if (!errors?.length) {
    return [{ code: 'E_SCHEMA', message: 'Validation failed', file }];
  }
  return errors.map((e) => {
    const node = doc ? resolvePathInDocument(doc, e.instancePath) : undefined;
    const pos = nodeLineCol(node);
    const message = e.message ?? 'Schema validation failed';
    return {
      code: 'E_SCHEMA' as const,
      message: `${e.instancePath || '/'}: ${message}`,
      file,
      ...(pos.line !== undefined ? { line: pos.line } : {}),
      ...(pos.col !== undefined ? { col: pos.col } : {}),
    };
  });
}
