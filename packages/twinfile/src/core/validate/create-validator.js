import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import Ajv2020Import from 'ajv/dist/2020.js';
import addFormatsImport from 'ajv-formats';
import { resolveSpecSchemasRoot } from '../paths/resolve-spec-package-root.js';
const specRoot = resolveSpecSchemasRoot();
const Ajv2020 = Ajv2020Import;
const addFormats = addFormatsImport;
function collectSchemaFiles(dir) {
    const out = [];
    for (const name of readdirSync(dir)) {
        const p = join(dir, name);
        if (statSync(p).isDirectory())
            out.push(...collectSchemaFiles(p));
        else if (name.endsWith('.schema.json'))
            out.push(p);
    }
    return out;
}
export function createTwinValidator() {
    const ajv = new Ajv2020({ strict: false, allErrors: true });
    addFormats(ajv);
    ajv.addSchema(JSON.parse(readFileSync(join(specRoot, 'defs.json'), 'utf8')));
    for (const file of collectSchemaFiles(specRoot)) {
        if (file.endsWith('defs.json'))
            continue;
        ajv.addSchema(JSON.parse(readFileSync(file, 'utf8')));
    }
    const validateTwinfile = ajv.getSchema('https://twinfile.org/schemas/1/twinfile/twinfile.schema.json');
    const validateLock = ajv.getSchema('https://twinfile.org/schemas/1/twinfile/lock.schema.json');
    if (!validateTwinfile || !validateLock) {
        throw new Error('Missing @local-hosting/twinfile Twinfile schemas');
    }
    return {
        validateTwinfile,
        validateLock,
        getSchema(schemaId) {
            return ajv.getSchema(schemaId) ?? undefined;
        },
    };
}
export const PLACE_LAYER_ROOT_KEYS = {
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
export function schemaIdForPlaceLayerDocument(data) {
    if (data === null || typeof data !== 'object' || Array.isArray(data))
        return undefined;
    const keys = Object.keys(data);
    if (keys.length !== 1)
        return undefined;
    const root = keys[0];
    if (!root)
        return undefined;
    return PLACE_LAYER_ROOT_KEYS[root];
}
function nodeLineCol(node) {
    if (!node?.range)
        return {};
    return { line: node.range[0] + 1, col: 0 };
}
function resolvePathInDocument(doc, instancePath) {
    if (!instancePath || instancePath === '/')
        return doc.contents ?? undefined;
    const segments = instancePath
        .replace(/^\//, '')
        .split('/')
        .filter(Boolean)
        .map((s) => {
        if (/^\d+$/.test(s))
            return Number(s);
        return s.replace(/~1/g, '/').replace(/~0/g, '~');
    });
    return doc.getIn(segments, true);
}
export function ajvErrorsToTwinErrors(file, doc, errors) {
    if (!errors?.length) {
        return [{ code: 'E_SCHEMA', message: 'Validation failed', file }];
    }
    return errors.map((e) => {
        const node = doc ? resolvePathInDocument(doc, e.instancePath) : undefined;
        const pos = nodeLineCol(node);
        const message = e.message ?? 'Schema validation failed';
        return {
            code: 'E_SCHEMA',
            message: `${e.instancePath || '/'}: ${message}`,
            file,
            ...(pos.line !== undefined ? { line: pos.line } : {}),
            ...(pos.col !== undefined ? { col: pos.col } : {}),
        };
    });
}
