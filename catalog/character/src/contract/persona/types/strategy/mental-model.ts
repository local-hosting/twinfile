import type { JourneyTouchpointRef } from '../story/journey.js';

export type MentalModelSupportLevel = 'weak' | 'good';

export type MentalModelHarmLevel = 'mild' | 'serious' | 'severe' | 'systemic';

/** How well one capability supports a tower — overall, or for one thinking style. */
export type MentalModelSupportAssessment =
  | { kind: 'support'; level: MentalModelSupportLevel; thinkingStyleId?: string }
  | { kind: 'harm'; level: MentalModelHarmLevel; thinkingStyleId?: string };

type MentalModelSupportBase = {
  id: string;
  /** How this item answers the tower's windows — one sentence a reviewer can dispute. */
  how?: string;
  assessments?: MentalModelSupportAssessment[];
};

export type MentalModelSupport =
  | ({ kind: 'feature' } & MentalModelSupportBase)
  | ({ kind: 'content' } & MentalModelSupportBase);

export type MentalModelWindowKind = 'inner-thinking' | 'reaction' | 'guiding-principle';

/**
 * One summarized pattern of interior cognition on a tower (Indi Young "window").
 * Thinking styles are layered here, not on the persona.
 */
export type MentalModelWindow = {
  id: string;
  kind: MentalModelWindowKind;
  text: string;
  thinkingStyleIds?: string[];
};

/**
 * Thematic cluster of JTBD job ids above the line.
 * Stacks reference groups via `jobGroupIds`; satisfaction stays on the stack (`support`).
 */
export type MentalModelJobGroup = {
  id: string;
  label?: string;
  jobs: string[];
};

/** @deprecated Use {@link MentalModelJobGroup}. */
export type MentalModelNeedGroup = MentalModelJobGroup & { needs?: string[] };

/** Matrix sub-column — product-usage theme (not venue-specific). */
export type MentalModelMatrixColumn = {
  id: string;
  label: string;
  /** Merged header band above this column (e.g. "Discover", "Account"). */
  group?: { id: string; label: string };
};

export type MentalModelMatrixRowTier = 'needs' | 'surface' | 'external';

export type MentalModelMatrixRow = {
  id: string;
  label: string;
  /**
   * `needs` = problem-space band (saturated) — JTBD jobs above the line.
   * `surface` = delivery channel / modality row (muted) — apps, web, email, venue floor, etc.
   * `external` = out-of-product band.
   */
  tier?: MentalModelMatrixRowTier;
  touchpoint?: JourneyTouchpointRef;
};

/** Layout-only cluster of stacks in one matrix cell. */
export type MentalModelStackGroup = {
  id: string;
  label?: string;
  stackIds: string[];
};

export type MentalModelMatrixCell = {
  rowId: string;
  columnId: string;
  stackGroupId: string;
};

/**
 * One skyline stack: **jobs (primary) and optional windows above a horizontal rule**,
 * **scope support below**. Cite ≥1 job or job group.
 * `support` is only features/content (never job ids). Satisfaction is stack-scoped.
 */
export type MentalModelStack = {
  id: string;
  label: string;
  /** Theme group — merged header above adjacent theme stacks (e.g. Value & cost). */
  stackGroup?: { id: string; label: string };
  /** Interior cognition above the line. */
  windows?: MentalModelWindow[];
  /** Ungrouped JTBD job ids — painted above the line. */
  jobs?: string[];
  /** Thematic job clusters (→ `MentalModel.jobGroups`) — above the line. */
  jobGroupIds?: string[];
  /** Features & content below the line (Scope ids). */
  support: MentalModelSupport[];
  columnId?: string;
};

type MentalModelBase = {
  id: string;
  label: string;
  /** The goal people are addressing, phrased from their side (e.g. "Get online at home"). */
  purpose?: string;
  /**
   * Owning character id(s). When the model lives under `personas/<pcm>/mental-models/`,
   * ownership is implied by the folder — `personaIds` may be omitted and is stamped on load.
   */
  personaIds?: string[];
  jobGroups?: MentalModelJobGroup[];
  stacks: MentalModelStack[];
};

/** Vertical stacks diagram — default when `layout` omitted. */
export type MentalModelStacksLayout = MentalModelBase & {
  layout?: 'stacks';
};

/** Usage matrix — themed columns × row bands; stack groups cluster in cells. */
export type MentalModelMatrixLayout = MentalModelBase & {
  layout: 'matrix';
  columns: MentalModelMatrixColumn[];
  rows: MentalModelMatrixRow[];
  stackGroups: MentalModelStackGroup[];
  cells: MentalModelMatrixCell[];
};

export type MentalModel = MentalModelStacksLayout | MentalModelMatrixLayout;
