import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { importExternal, writeImportedFiles } from '@local-hosting/twinfile-bridge';
import { describe, expect, it } from 'vitest';

import { loadTwinfile } from '../src/load/load-twinfile.js';
import { TWIN_HEAD_SUFFIX } from '../src/types/twin-kind.js';

const specRoot = join(dirname(fileURLToPath(import.meta.url)), '../../spec');

function readSpec(rel: string): string {
  return readFileSync(join(specRoot, rel), 'utf8');
}

function withManifestId(files: Record<string, string>): Record<string, string> {
  const key = Object.keys(files).find((rel) => !rel.includes('/') && rel.endsWith(TWIN_HEAD_SUFFIX));
  if (!key) return files;
  const raw = files[key];
  if (/^id:/m.test(raw)) return files;
  const name = /^name:\s*(.+)$/m.exec(raw)?.[1]?.trim() ?? 'imported';
  return { ...files, [key]: raw.replace(/^kind:\s*.+$/m, (line) => `${line}\nid: ${name}`) };
}

function checkUnit(files: Record<string, string>): void {
  const dir = mkdtempSync(join(tmpdir(), 'twin-import-'));
  try {
    writeImportedFiles(dir, withManifestId(files));
    const loaded = loadTwinfile(dir);
    expect(loaded.ok, loaded.ok ? '' : loaded.errors.map((error) => error.message).join('; ')).toBe(true);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

describe('bridge import → core loadTwinfile', () => {
  it('accepts IMDF and GTFS units from @local-hosting/twinfile-bridge', () => {
    const imdf = importExternal('imdf', JSON.parse(readSpec('conf/map/imdf-venue.json')) as unknown);
    checkUnit(imdf.files);

    const gtfs = importExternal('gtfs', {
      stops: readSpec('conf/map/gtfs/stops.txt'),
      shapes: readSpec('conf/map/gtfs/shapes.txt'),
      pathways: readSpec('conf/map/gtfs/pathways.txt'),
    });
    checkUnit(gtfs.files);

    const igml = importExternal('indoorgml', JSON.parse(readSpec('conf/map/indoorgml-building.json')) as unknown);
    checkUnit(igml.files);
  });
});
