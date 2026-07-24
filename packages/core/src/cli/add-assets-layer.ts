import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { twinHeadPath } from '../load/twinfile-locator.js';

import { stringify as stringifyYaml } from 'yaml';

import { isPatchesTwinfile } from '../load/twinfile-instructions.js';
import { starterLayerStep } from './starter-rows.js';
import { readTwinfileDoc, upsertStepItem, writeTwinfileDoc } from './twinfile-steps.js';

export type AddAssetsLayerOptions = {
  force?: boolean;
};

const STARTER_ASSETS_HEADER = '# Decorator starter — bind devices/signage to space ids (twin add assets)\n';

function addAssetsPatch(twinfilePath: string, twinfile: Record<string, unknown>, force: boolean): string {
  const index = upsertStepItem(twinfile, starterLayerStep('assets'), (item) => 'assets' in item, force);
  if (index < 0) throw new Error('Assets step already exists in steps: (use --force)');
  writeTwinfileDoc(twinfilePath, twinfile);
  return `steps[${index}]`;
}

function addAssetsLayerFile(unitDir: string, twinfilePath: string, twinfile: Record<string, unknown>, force: boolean): string {
  const layerRelPath = 'place/assets.yaml';
  const layerAbsPath = join(unitDir, layerRelPath);
  if (existsSync(layerAbsPath) && !force) {
    throw new Error(`Assets layer already exists: ${layerAbsPath} (use --force)`);
  }
  mkdirSync(join(unitDir, 'place'), { recursive: true });
  writeFileSync(layerAbsPath, STARTER_ASSETS_HEADER + stringifyYaml(starterLayerStep('assets')));

  const layers = Array.isArray(twinfile.layers) ? [...twinfile.layers.map(String)] : [];
  if (!layers.includes(layerRelPath)) {
    layers.push(layerRelPath);
    twinfile.layers = layers;
    writeFileSync(twinfilePath, stringifyYaml(twinfile));
  }
  return layerRelPath;
}

/** Add a starter `assets:` patch (v2 inline item, v1 `place/assets.yaml` layer); returns where it was written. */
export function addAssetsLayerToPlace(
  unitDir: string,
  options: AddAssetsLayerOptions = {},
): { location: string } {
  const twinfilePath = twinHeadPath(unitDir);
  if (!existsSync(twinfilePath)) {
    throw new Error(`Missing twin head in ${unitDir}`);
  }
  const twinfile = readTwinfileDoc(twinfilePath);
  if (twinfile.kind !== 'place') {
    throw new Error('twin add assets requires a place Twinfile');
  }
  const force = options.force ?? false;
  const location = isPatchesTwinfile(twinfile)
    ? addAssetsPatch(twinfilePath, twinfile, force)
    : addAssetsLayerFile(unitDir, twinfilePath, twinfile, force);
  return { location };
}
