import type { PCM } from './pcm.js';

/** Portable PCM contract version implemented by this package. */
export const PCM_SPEC_VERSION = 1;

export type PCMSpecVersion = typeof PCM_SPEC_VERSION;

export function pcmSpecVersion(pcm: PCM): PCMSpecVersion {
  return pcm.version;
}

const SUPPORTED_PCM_SPECS = [PCM_SPEC_VERSION] as const;

export function assertSupportedPCMSpec(version: number): void {
  if (!(SUPPORTED_PCM_SPECS as readonly number[]).includes(version)) {
    throw new Error(
      `Unsupported PCMSpec ${version} (this package implements PCMSpec ${SUPPORTED_PCM_SPECS.join(', ')})`,
    );
  }
}
