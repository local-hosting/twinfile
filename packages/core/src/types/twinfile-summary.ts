import type { TwinfileUseMode } from './twinfile-spec.js';

export type { TwinfileUseMode };

/** Stable host projection for UI, CLI, and MCP (`place_card`, `twin summary`). */
export type TwinfileSummaryHeader = {
  name: string;
  /** Omitted when it would only repeat the hero chips (kind, `name@version`). */
  subtitle?: string;
  /** Geotype acronym when present, else short unit badge. */
  icon: string;
};

export type TwinfileSummaryAspect = {
  id: string;
  label: string;
  value: string | number | boolean;
  /** Legacy; ignored (single place layout). */
  mode?: TwinfileUseMode;
};

export type TwinfileSummaryIoPort = {
  id: string;
  label: string;
  kind?: string;
  detail?: string;
  /** Legacy; ignored (single place layout). */
  mode?: TwinfileUseMode;
};

/** One row in a summary section — map 1:1 to a UI list item or stat cell. */
export type TwinfileSummaryLayoutRow = {
  id: string;
  label: string;
  value?: string | number | boolean;
  hint?: string;
  kind?: string;
};

/** Presentation blocks for any renderer (Vue, React, HTML, …); derived from the summary, not authored. */
export type TwinfileSummaryBlock =
  | {
      type: 'hero';
      icon: string;
      title: string;
      subtitle?: string;
      chips: string[];
    }
  | {
      type: 'stats';
      title: string;
      items: Array<{ id: string; label: string; value: string | number; hint?: string }>;
    }
  | {
      type: 'list';
      title: string;
      rows: TwinfileSummaryLayoutRow[];
    }
  | {
      type: 'ports';
      direction: 'in' | 'out';
      title: string;
      rows: TwinfileSummaryLayoutRow[];
    }
  | {
      type: 'io';
      /** Prose section title (default host patch). */
      title?: string;
      inputs: TwinfileSummaryLayoutRow[];
      outputs: TwinfileSummaryLayoutRow[];
    }
  | {
      type: 'note';
      text: string;
    };

export type TwinfileSummaryLayoutV1 = {
  schema: 'twinfile.summary.layout.v1';
  mode: TwinfileUseMode;
  /** Display title for the layout (default "Site"). */
  title: string;
  blocks: TwinfileSummaryBlock[];
};

export type TwinfileSummaryV1 = {
  schema: 'twinfile.summary.v1';
  digest: string | null;
  head: {
    kind: string;
    id: string;
    name: string;
    version: string;
    stability?: string;
    ref?: string;
  };
  header: TwinfileSummaryHeader;
  /**
   * Compose / manifest audit (runs, events, mixins). Omitted on built **sites** — live state is `io` only.
   */
  fixed: TwinfileSummaryAspect[];
  /** Run-time and merged-place rollups (presets, mixins). Empty for `kind: place` site cards. */
  variables: TwinfileSummaryAspect[];
  io: {
    inputs: TwinfileSummaryIoPort[];
    outputs: TwinfileSummaryIoPort[];
  };
  /** Place layout for host renderers (events arrive via processor inputs). */
  layouts: Record<TwinfileUseMode, TwinfileSummaryLayoutV1>;
};

/** Summary before layouts are derived. */
export type TwinfileSummaryVenueVisit = {
  id: string;
  label: string;
  space?: string;
};

export type TwinfileSummaryBase = Omit<TwinfileSummaryV1, 'layouts'> & {
  /** Inline manifest regions (workbench sidebar); omitted when only a rollup count is shown. */
  regions?: Array<{ id: string; name?: string }>;
  /** Visit moments from `visits[]` when a renderer lists them (preset I/O also exposes visits). */
  venueVisits?: TwinfileSummaryVenueVisit[];
};

export type BuildTwinfileSummaryInput = {
  twinfile: Record<string, unknown>;
  /** Distinguishes run presets from place Twinfiles (no `kind` on disk). */
  unitPath?: string;
  digest?: string | null;
  place?: Record<string, unknown>;
  /** When set, site summary I/O is taken from `Place.meta.placeType` (post-`twin build`). */
  placeType?: unknown;
  eventBindings?: Record<string, Record<string, unknown>>;
  events?: Record<string, unknown>[];
  resolvedArgs?: Record<string, unknown>;
};
