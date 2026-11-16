import { readFileSync } from 'node:fs';
import { basename, join } from 'node:path';

import {
  err,
  isRunUnit,
  loadTwinfile,
  loadUnitRoot,
  twinfileDisplayName,
  twinfileRefId,
  ok,
  type Result,
} from '@doppler-group/twinfile-core';

function twinfileField(twinfile: Record<string, unknown>, key: string): string {
  const value = twinfile[key];
  return typeof value === 'string' ? value : String(value ?? '');
}

export type ViewerTwinfilePayload = {
  schema: 'twinfile.viewer.twinfile.v1';
  twinfile: string;
  /** Ref slug — manifest `id`. */
  id: string;
  name: string;
  kind: string;
  version: string;
  text: string;
};

/** Declarative unit head: `Twinfile.yaml` or run `preset.yaml`. */
export function readViewerTwinfileYaml(unitDir: string): Result<ViewerTwinfilePayload> {
  const loaded = loadUnitRoot(unitDir);
  if (!loaded.ok) {
    return err(loaded.errors);
  }
  const { root, twinfilePath, twinfile } = loaded.value;
  const rel = basename(twinfilePath);
  const text = readFileSync(join(root, rel), 'utf8');
  const kind = isRunUnit(loaded.value)
    ? 'run'
    : twinfileField(twinfile, 'kind') || 'place';
  return ok({
    schema: 'twinfile.viewer.twinfile.v1',
    twinfile: rel,
    id: twinfileRefId(twinfile) ?? twinfileField(twinfile, 'id'),
    name: twinfileDisplayName(twinfile),
    kind,
    version: twinfileField(twinfile, 'version'),
    text,
  });
}
