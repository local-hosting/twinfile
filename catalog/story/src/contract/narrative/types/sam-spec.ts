import type { SAM } from './sam.js';

/** Portable SAMSpec contract version implemented by this package. */
export const SAM_SPEC_VERSION = 1;

export type SAMSpecVersion = typeof SAM_SPEC_VERSION;

export function samSpecVersion(sam: SAM): SAMSpecVersion {
  return sam.version;
}

const SUPPORTED_SAM_SPECS = [SAM_SPEC_VERSION] as const;

export function assertSupportedSAMSpec(version: number): void {
  if (!(SUPPORTED_SAM_SPECS as readonly number[]).includes(version)) {
    throw new Error(
      `Unsupported SAMSpec ${version} (this package implements SAMSpec ${SUPPORTED_SAM_SPECS.join(', ')})`,
    );
  }
}
