/** Pinned Twinfile manifest version (`twinfile:` field). */
export const TWINFILE_FORMAT_VERSION = 1 as const;

/** npm release of `@local-hosting/twinfile` this core build targets. */
export const CORE_SPEC_PIN = '1.0.0-draft.1' as const;

export type TwinfileFormatVersion = typeof TWINFILE_FORMAT_VERSION;

/** Primary summary layout id (events arrive via context inputs, not catalog modes). */
export const TWINFILE_SUMMARY_LAYOUT_ID = 'place' as const;

/** Single layout id for summary markdown and ASCII. */
export const TWINFILE_USE_MODES = [TWINFILE_SUMMARY_LAYOUT_ID] as const;

export type TwinfileUseMode = typeof TWINFILE_SUMMARY_LAYOUT_ID;

export const TWINFILE_USE_MODE_TITLES: Record<TwinfileUseMode, string> = {
  place: 'Site',
};

export function assertSupportedTwinfileVersion(version: number): void {
  if (version !== TWINFILE_FORMAT_VERSION) {
    throw new Error(
      `Unsupported twinfile format version ${version} (core supports ${TWINFILE_FORMAT_VERSION})`,
    );
  }
}
