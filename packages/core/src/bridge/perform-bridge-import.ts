import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { basename, resolve } from 'node:path';

import {
  importIfc,
  isIfcBytesInput,
  isRegisteredBridgeId,
  resolveBridge,
  resolveBridgeRef,
  writeImportedFiles,
  type TwinBridge,
} from '@doppler-group/twinfile-bridge';

export type BridgeImportResult =
  | { ok: true; bridgeId: string; outDir: string; files: string[] }
  | { ok: false; error: string };

function readImportInput(bridge: TwinBridge, inputPath: string): unknown {
  if (bridge.crosswalkSource === 'gtfs') {
    return {
      stops: readFileSync(resolve(inputPath, 'stops.txt'), 'utf8'),
      shapes: readFileSync(resolve(inputPath, 'shapes.txt'), 'utf8'),
      ...(existsSync(resolve(inputPath, 'pathways.txt'))
        ? { pathways: readFileSync(resolve(inputPath, 'pathways.txt'), 'utf8') }
        : {}),
    };
  }
  if (bridge.id === 'ifc' && /\.ifc$/i.test(inputPath)) {
    const file = `sources/${basename(inputPath)}`;
    return { ifcBytes: new Uint8Array(readFileSync(resolve(inputPath))), file };
  }
  return JSON.parse(readFileSync(resolve(inputPath), 'utf8')) as unknown;
}

export async function performBridgeImport(params: {
  bridge: string;
  inputPath: string;
  outDir: string;
}): Promise<BridgeImportResult> {
  const outDir = resolve(params.outDir);
  const inputPath = resolve(params.inputPath);
  const bridgeRef = params.bridge.trim();

  let bridge: TwinBridge;
  try {
    bridge = isRegisteredBridgeId(bridgeRef) ? resolveBridgeRef(bridgeRef) : await resolveBridge(bridgeRef);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }

  if (!bridge.importPlace) {
    return { ok: false, error: `bridge ${bridge.id} does not support import` };
  }

  try {
    const input = readImportInput(bridge, inputPath);
    const imported =
      bridge.id === 'ifc' && isIfcBytesInput(input)
        ? await importIfc(input)
        : await Promise.resolve(bridge.importPlace(input));
    writeImportedFiles(outDir, imported.files);
    const files = readdirSync(outDir);
    return { ok: true, bridgeId: bridge.id, outDir, files };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}
