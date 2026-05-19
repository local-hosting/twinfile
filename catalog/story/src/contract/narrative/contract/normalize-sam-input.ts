import { SAM_SPEC_VERSION } from '../types/sam-spec.js';
import { normalizeSAMAssociations } from './normalize-sam-associations.js';

function resolveSAMSpecVersion(raw: Record<string, unknown>): number {
  const fromSAMSpec = raw.samSpec;
  const fromVersion = raw.version;
  const specFields = [fromSAMSpec, fromVersion].filter((value) => value !== undefined);
  if (specFields.length > 1 && new Set(specFields).size > 1) {
    throw new Error(
      `samSpec (${fromSAMSpec}) and version (${fromVersion}) must agree (SAMSpec contract)`,
    );
  }
  const resolved = fromSAMSpec ?? fromVersion ?? SAM_SPEC_VERSION;
  if (typeof resolved !== 'number' || !Number.isInteger(resolved)) {
    throw new Error('samSpec must be an integer SAMSpec version');
  }
  return resolved;
}

function isoDateStringFromYaml(value: unknown): unknown {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  return value;
}

/** Fold `samSpec` / legacy `version` → `version` before Zod parse. */
export function normalizeSAMInput(input: unknown): unknown {
  if (typeof input !== 'object' || input === null) {
    return input;
  }
  const raw = input as Record<string, unknown>;
  const binding = raw.binding;
  if (typeof binding === 'object' && binding !== null) {
    const bindingRecord = binding as Record<string, unknown>;
    raw.binding = {
      ...bindingRecord,
      simulationEpochStart: isoDateStringFromYaml(bindingRecord.simulationEpochStart),
    };
  }
  const specVersion = resolveSAMSpecVersion(raw);
  if (specVersion !== SAM_SPEC_VERSION) {
    throw new Error(
      `Unsupported SAMSpec ${specVersion} (this package implements SAMSpec ${SAM_SPEC_VERSION})`,
    );
  }
  const { samSpec: _samSpec, ...rest } = raw;
  return normalizeSAMAssociations({ ...rest, version: specVersion });
}
