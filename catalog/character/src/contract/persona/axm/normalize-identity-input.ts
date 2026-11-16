import { AXM_SPEC_VERSION } from '../types/axm-spec.js';
import { mergeHostContexts, normalizeHostContext } from './normalize-host.js';
import type { AXMEncounter } from '../types/identity/encounter.js';

function resolveAXMSpecVersion(raw: Record<string, unknown>): number {
  const fromAXMSpec = raw.axmSpec;
  const fromLegacyXmSpec = raw.xmSpec;
  const fromVersion = raw.version;
  const specFields = [fromAXMSpec, fromLegacyXmSpec, fromVersion].filter((v) => v !== undefined);
  if (specFields.length > 1 && new Set(specFields).size > 1) {
    throw new Error(
      `axmSpec (${fromAXMSpec}), xmSpec (${fromLegacyXmSpec}), and version (${fromVersion}) must agree (AXMSpec contract)`,
    );
  }
  const resolved = fromAXMSpec ?? fromLegacyXmSpec ?? fromVersion ?? AXM_SPEC_VERSION;
  if (typeof resolved !== 'number' || !Number.isInteger(resolved)) {
    throw new Error('axmSpec must be an integer AXMSpec version');
  }
  if (resolved === 2) {
    return AXM_SPEC_VERSION;
  }
  return resolved;
}

/** Fold root `host`, `axmSpec` / legacy `xmSpec` → `version`, and `encounter.host` before Zod parse. */
export function normalizeAXMIdentityInput(input: unknown): unknown {
  if (typeof input !== 'object' || input === null) {
    return input;
  }

  const raw = input as Record<string, unknown>;
  const specVersion = resolveAXMSpecVersion(raw);
  const encounterRaw =
    typeof raw.encounter === 'object' && raw.encounter !== null
      ? { ...(raw.encounter as Record<string, unknown>) }
      : {};

  const rootHost = raw.host;
  const encounterHost = encounterRaw.host;
  const rootHostIsPlacement =
    rootHost !== undefined && typeof rootHost === 'object' && rootHost !== null;

  if (rootHostIsPlacement || encounterHost !== undefined) {
    const merged = mergeHostContexts(
      rootHostIsPlacement
        ? normalizeHostContext(rootHost as Parameters<typeof normalizeHostContext>[0])
        : undefined,
      encounterHost !== undefined
        ? normalizeHostContext(encounterHost as Parameters<typeof normalizeHostContext>[0])
        : undefined,
    );
    if (merged) {
      encounterRaw.host = merged;
    }
  }

  const { host: rootHostField, axmSpec: _axmSpec, xmSpec: _xmSpec, ...rest } = raw;
  const encounter = Object.keys(encounterRaw).length > 0 ? encounterRaw : undefined;
  const appletHost =
    typeof rootHostField === 'string' ? { host: rootHostField } : {};

  return { ...rest, ...appletHost, encounter, version: specVersion };
}

export function normalizeTouchpointInput<T extends Record<string, unknown>>(touchpoint: T): T {
  const host = touchpoint.host;
  const encounter = touchpoint.encounter as AXMEncounter | undefined;

  if (host === undefined) {
    return touchpoint;
  }

  const mergedHost = mergeHostContexts(
    encounter?.host,
    normalizeHostContext(host as Parameters<typeof normalizeHostContext>[0]),
  );

  const { host: _h, ...rest } = touchpoint;
  const next = {
    ...rest,
    encounter: mergedHost ? { ...encounter, host: mergedHost } : encounter,
  };
  return next as unknown as T;
}
