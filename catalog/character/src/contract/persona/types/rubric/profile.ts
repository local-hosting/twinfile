import type { HoneycombFacetId } from '../strategy/honeycomb.js';
import type { HeartDimension } from '../story/heart.js';
import type { RubricCriterion } from './grade.js';

/** Global Grade rubric profiles shipped in `config/rubric/`. */
export const RUBRIC_PROFILE_IDS = [
  'for-profit',
  'startup',
  'non-profit',
  'public-benefit',
] as const;

export type RubricProfileId = (typeof RUBRIC_PROFILE_IDS)[number];

export const DEFAULT_RUBRIC_PROFILE: RubricProfileId = 'for-profit';

/** Each weight bucket must allocate exactly this many points. */
export const RUBRIC_WEIGHT_TOTAL = 10;

export function isRubricProfileId(value: string): value is RubricProfileId {
  return (RUBRIC_PROFILE_IDS as readonly string[]).includes(value);
}

/** Scope `good` axes (user / business / tech / global·SDG). */
export const SCOPE_GOOD_AXIS_IDS = ['user', 'business', 'tech', 'global'] as const;
export type ScopeGoodAxisId = (typeof SCOPE_GOOD_AXIS_IDS)[number];

/** Completeness spine keys in `weights.completeness`. */
export const COMPLETENESS_WEIGHT_KEYS = [
  'strategy-spine',
  'structure-spine',
  'scope-floors',
] as const;
export type CompletenessWeightKey = (typeof COMPLETENESS_WEIGHT_KEYS)[number];

/** Non-user quality checklist (trace only — user good lives under `good` / `user`). */
export const QUALITY_WEIGHT_KEYS = ['trace'] as const;
export type QualityWeightKey = (typeof QUALITY_WEIGHT_KEYS)[number];

/**
 * Subcategories of **user good** — scope fulfillment, UX honeycomb, HEART, skyline support.
 * Nested facet/dimension detail lives in `weights.honeycomb` and `weights.heart`.
 */
export const USER_GOOD_WEIGHT_KEYS = ['scope', 'honeycomb', 'heart', 'skyline'] as const;
export type UserGoodWeightKey = (typeof USER_GOOD_WEIGHT_KEYS)[number];

/**
 * Point allocations out of {@link RUBRIC_WEIGHT_TOTAL} (10) per bucket.
 *
 * Hierarchy: `good.user` is composed from `user` (scope / honeycomb / heart / skyline);
 * `honeycomb` and `heart` further split those user subcategories.
 */
export type RubricProfileWeights = {
  /** Spine / floors — Grade.completeness. */
  completeness: Record<CompletenessWeightKey, number>;
  /** Delivery quality outside user-good (trace). */
  quality: Record<QualityWeightKey, number>;
  /** U / B / T / G — user score comes from {@link RubricProfileWeights.user}. */
  good: Record<ScopeGoodAxisId, number>;
  /** How user good is composed (subcategories of `good.user`). */
  user: Record<UserGoodWeightKey, number>;
  /** Facet split inside `user.honeycomb`. */
  honeycomb: Record<HoneycombFacetId, number>;
  /** Dimension split inside `user.heart`. */
  heart: Record<HeartDimension, number>;
};

export type RubricProfile = {
  id: RubricProfileId;
  label: string;
  description?: string;
  weights: RubricProfileWeights;
};

export type RubricProfileCriteria = RubricCriterion[];
