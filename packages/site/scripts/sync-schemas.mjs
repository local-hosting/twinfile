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

const specRoot = join(siteRoot, '..', 'spec', 'schemas', '1');
if (!statSync(specRoot, { throwIfNoEntry: false })?.isDirectory()) {
  throw new Error(`sync-schemas: missing ${specRoot} (run from the twinfile monorepo)`);
}
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
