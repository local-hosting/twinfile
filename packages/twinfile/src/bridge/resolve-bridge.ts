import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

import { bridge as botBridge } from './builtins/bot/index.js';
import { bridge as brickBridge } from './builtins/brick/index.js';
import { bridge as gltfBridge } from './builtins/gltf/index.js';
import { bridge as gtfsBridge } from './builtins/gtfs/index.js';
import { bridge as ifcBridge } from './builtins/ifc/index.js';
import { bridge as imdfBridge } from './builtins/imdf/index.js';
import { bridge as indoorgmlBridge } from './builtins/indoorgml/index.js';
import { bridge as sosaBridge } from './builtins/sosa/index.js';
import type { TwinBridge } from './types.js';

const require = createRequire(import.meta.url);

const BUILTIN_BRIDGES: Record<string, TwinBridge> = {
  imdf: imdfBridge,
  gtfs: gtfsBridge,
  brick: brickBridge,
  bot: botBridge,
  sosa: sosaBridge,
  gltf: gltfBridge,
  ifc: ifcBridge,
  indoorgml: indoorgmlBridge,
};

/** Built-in id → primary npm package (built-ins ship in `@local-hosting/twinfile/bridge`). */
export const BRIDGE_PACKAGES: Record<string, string> = Object.fromEntries(
  Object.keys(BUILTIN_BRIDGES).map((id) => [id, '@local-hosting/twinfile/bridge']),
);

/** Parse `npm:@scope/pkg@^1` → package name for resolve. */
export function npmPackageName(ref: string): string {
  if (!ref.startsWith('npm:')) throw new Error(`bridge ref must start with npm: (${ref})`);
  const body = ref.slice('npm:'.length).trim();
  const slashAt = body.indexOf('@', 1);
  if (slashAt > 0 && body.startsWith('@')) {
    const nextAt = body.indexOf('@', slashAt + 1);
    return nextAt > 0 ? body.slice(0, nextAt) : body;
  }
  const at = body.indexOf('@');
  return at > 0 ? body.slice(0, at) : body;
}

export function isRegisteredBridgeId(id: string): boolean {
  return id in BUILTIN_BRIDGES;
}

export function listRegisteredBridgeIds(): string[] {
  return Object.keys(BUILTIN_BRIDGES).sort();
}

export function resolveBridgeRef(ref: string): TwinBridge {
  const bridge = BUILTIN_BRIDGES[ref];
  if (!bridge) throw new Error(`unknown bridge id "${ref}"; use ${listRegisteredBridgeIds().join(', ')}`);
  return bridge;
}

export async function loadBridgeFromNpm(ref: string): Promise<TwinBridge> {
  const name = npmPackageName(ref);
  let resolved: string;
  try {
    resolved = require.resolve(name);
  } catch {
    throw new Error(`bridge package not installed: ${name} (${ref})`);
  }
  const mod = (await import(
    /* webpackIgnore: true */ /* turbopackIgnore: true */ /* @vite-ignore */ pathToFileURL(resolved).href
  )) as { bridge?: TwinBridge; default?: TwinBridge };
  const bridge = mod.bridge ?? mod.default;
  if (!bridge?.importPlace && !bridge?.exportPlace) {
    throw new Error(`${name}: export a TwinBridge as "bridge" or default`);
  }
  return bridge;
}

export async function resolveBridge(ref: string): Promise<TwinBridge> {
  if (ref.startsWith('npm:')) return loadBridgeFromNpm(ref);
  return resolveBridgeRef(ref);
}
