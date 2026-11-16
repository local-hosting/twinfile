import { assertSupportedPCMSpec, PCM_SPEC_VERSION } from '../types/pcm-spec.js';

function resolvePCMSpecVersion(raw: Record<string, unknown>): number {
  const fromPCMSpec = raw.pcmSpec;
  const fromVersion = raw.version;
  const specFields = [fromPCMSpec, fromVersion].filter((value) => value !== undefined);
  if (specFields.length > 1 && new Set(specFields).size > 1) {
    throw new Error(
      `pcmSpec (${fromPCMSpec}) and version (${fromVersion}) must agree (PCMSpec contract)`,
    );
  }
  const resolved = fromPCMSpec ?? fromVersion ?? PCM_SPEC_VERSION;
  if (typeof resolved !== 'number' || !Number.isInteger(resolved)) {
    throw new Error('pcmSpec must be an integer PCMSpec version');
  }
  return resolved;
}

/** Expand legacy UserNeed wrappers (`{ text, jobs: [...] }`) into flat JTBD jobs. */
function flattenLegacyJobRows(rows: unknown[]): unknown[] {
  const out: unknown[] = [];
  for (const row of rows) {
    if (!row || typeof row !== 'object' || Array.isArray(row)) {
      out.push(row);
      continue;
    }
    const item = row as Record<string, unknown>;
    if (Array.isArray(item.jobs) && typeof item.when !== 'string') {
      for (const nested of item.jobs) {
        if (!nested || typeof nested !== 'object' || Array.isArray(nested)) {
          out.push(nested);
          continue;
        }
        const job = nested as Record<string, unknown>;
        out.push({
          ...job,
          text:
            typeof job.text === 'string' && job.text.length > 0
              ? job.text
              : typeof item.text === 'string'
                ? item.text
                : job.id,
        });
      }
      continue;
    }
    out.push(row);
  }
  return out;
}

/** Fold `pcmSpec` / legacy `version` → `version` before Zod parse. */
export function normalizePCMInput(input: unknown): unknown {
  if (typeof input !== 'object' || input === null) {
    return input;
  }
  const raw = input as Record<string, unknown>;
  const specVersion = resolvePCMSpecVersion(raw);
  assertSupportedPCMSpec(specVersion);
  const { pcmSpec: _pcmSpec, userNeeds, ...rest } = raw;
  const jobsSource = Array.isArray(rest.jobs)
    ? rest.jobs
    : Array.isArray(userNeeds)
      ? userNeeds
      : undefined;
  return {
    ...rest,
    version: specVersion,
    ...(jobsSource ? { jobs: flattenLegacyJobRows(jobsSource) } : {}),
  };
}
