import {
  cpSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const siteRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

function resolveSpecSchemasDir() {
  const fromEnv = process.env.TF_SPEC_ROOT;
  if (fromEnv) {
    return join(fromEnv, 'schemas', '1');
  }
  const candidates = [
    join(siteRoot, '..', 'packages', 'spec', 'schemas', '1'),
    join(siteRoot, '..', 'spec', 'schemas', '1'),
    join(siteRoot, 'spec', 'schemas', '1'),
  ];
  for (const candidate of candidates) {
    try {
      if (statSync(candidate).isDirectory()) return candidate;
    } catch {
      // try next
    }
  }
  throw new Error(
    'Could not find @local-hosting/twinfile schemas. Clone twinfile/spec as a sibling, vendor under ./spec, or set TF_SPEC_ROOT.',
  );
}

const specRoot = resolveSpecSchemasDir();
const publicSchemas = join(siteRoot, 'public', 'schemas', '1');
const schemaIdPrefix = 'https://twinfile.org/schemas/1/';

function collectJsonFiles(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) out.push(...collectJsonFiles(path));
    else if (name.endsWith('.json') || name.endsWith('.jsonld')) out.push(path);
  }
  return out;
}

function publicPathForId(id) {
  if (!id.startsWith(schemaIdPrefix)) return null;
  return join(publicSchemas, id.slice(schemaIdPrefix.length));
}

function sync() {
  rmSync(join(siteRoot, 'public', 'schemas'), { recursive: true, force: true });

  for (const file of collectJsonFiles(specRoot)) {
    const raw = readFileSync(file, 'utf8');
    let doc;
    try {
      doc = JSON.parse(raw);
    } catch {
      continue;
    }

    const id = doc.$id;
    if (typeof id !== 'string') continue;

    const dest = publicPathForId(id);
    if (!dest) continue;

    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, `${JSON.stringify(doc, null, 2)}\n`);
  }

  const contextSrc = join(specRoot, 'oci', 'context.jsonld');
  const contextDest = join(publicSchemas, 'oci', 'context.jsonld');
  mkdirSync(dirname(contextDest), { recursive: true });
  cpSync(contextSrc, contextDest);
}

sync();
