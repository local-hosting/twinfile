import { resolve } from 'node:path';

import {
  isRegisteredBridgeId,
  resolveBridge,
  resolveBridgeRef,
  writeImportedFiles,
  type TwinBridge,
} from '@local-hosting/twinfile/bridge';

import { performBridgeImport } from '@local-hosting/twinfile';
import { buildTwinfile } from '../build/build-twinfile.js';
import { resolveExamplesRoot } from '@local-hosting/twinfile';

import { formatTwinErrors } from '@local-hosting/twinfile/cli';

function flag(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

function positionalArgs(args: string[]): string[] {
  return args.filter((arg, index, all) => {
    if (arg.startsWith('--')) return false;
    const prev = all[index - 1];
    return prev !== '--out' && prev !== '--bridge';
  });
}

function shiftBridgeFlag(args: string[]): { bridgeRef?: string; rest: string[] } {
  const index = args.indexOf('--bridge');
  if (index < 0) return { rest: args };
  const bridgeRef = args[index + 1];
  const rest = [...args.slice(0, index), ...args.slice(index + 2)];
  return { bridgeRef, rest };
}

export async function runImport(args: string[]): Promise<number> {
  const { bridgeRef, rest } = shiftBridgeFlag(args);
  const outDir = flag(rest, '--out');
  const positional = positionalArgs(rest);
  if (!outDir) {
    console.error('twin import [<source>] <file-or-dir> --out <dir>');
    console.error('twin import --bridge <source-id|npm:…> <file-or-dir> --out <dir>');
    return 2;
  }

  let bridge: TwinBridge;
  let inputPath: string | undefined;

  if (bridgeRef) {
    try {
      bridge = await resolveBridge(bridgeRef);
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error));
      return 2;
    }
    inputPath = positional[0];
  } else {
    const source = positional[0];
    if (!source || !isRegisteredBridgeId(source)) {
      console.error('twin import <imdf|gtfs|brick|bot|sosa|gltf|ifc|indoorgml> <file-or-dir> --out <dir>');
      return 2;
    }
    bridge = resolveBridgeRef(source);
    inputPath = positional[1];
  }

  if (!inputPath) {
    console.error('twin import needs a source path');
    return 2;
  }
  if (!bridge.importPlace) {
    console.error(`bridge ${bridge.id} does not support import`);
    return 2;
  }

  const bridgeArg = bridgeRef ?? bridge.id;
  const result = await performBridgeImport({ bridge: bridgeArg, inputPath: resolve(inputPath), outDir: resolve(outDir) });
  if (!result.ok) {
    console.error(result.error);
    return 1;
  }
  console.log(`ok import ${result.bridgeId} ${result.outDir}`);
  return 0;
}

export async function runExportExternal(args: string[]): Promise<number> {
  const { bridgeRef, rest } = shiftBridgeFlag(args);
  const outDir = resolve(flag(rest, '--out') ?? '.');
  const positional = positionalArgs(rest);

  let bridge: TwinBridge;
  let dir: string;

  if (bridgeRef) {
    try {
      bridge = await resolveBridge(bridgeRef);
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error));
      return 2;
    }
    dir = resolve(positional[0] ?? '.');
  } else {
    const source = positional[0];
    if (!source || !isRegisteredBridgeId(source)) {
      console.error('twin export <imdf|gtfs|brick|bot|sosa|indoorgml> [dir] --out <dir>');
      return 2;
    }
    bridge = resolveBridgeRef(source);
    dir = resolve(positional[1] ?? '.');
  }

  if (!bridge.exportPlace) {
    console.error(`bridge ${bridge.id} does not support export`);
    return 2;
  }

  const examplesRoot = resolveExamplesRoot(dir);
  const built = await buildTwinfile(dir, {
    examplesRoot,
        writeLock: false,
      });
  if (!built.ok) {
    console.error(formatTwinErrors(dir, built.errors).join('\n'));
    return 1;
  }

  try {
    const files = bridge.exportPlace(built.value.data as Record<string, unknown>);
    writeImportedFiles(outDir, files);
    console.log(`ok export ${bridge.id} ${outDir}`);
    return 0;
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
}
