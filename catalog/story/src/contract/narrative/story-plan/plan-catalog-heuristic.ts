import type { SamStoryPlanCatalogSnapshotV1 } from '../types/story-plan-catalog.js';
import {
  pickRandomEngagementLevel,
  pickRandomFrom,
  pickRandomStoryPlanStoreSlug,
} from './random.js';
import { resolveStoryPlanRandom } from './rng.js';
import {
  normalizeScenarioText,
  scoreFleetPlaceScenarioMatch,
  scoreScenarioTokenOverlap,
} from './scenario-scoring.js';

export type SamStoryPlanHeuristicSelectionV1 = {
  segmentId: string;
  storeSlug?: string;
  engagementLevelId: string;
  intentIds: string[];
  rationale: string;
};

function pickEngagement(
  scenario: string,
  allowed: readonly string[],
  random: () => number,
): string {
  const text = normalizeScenarioText(scenario);
  const ordered: Array<{ id: string; patterns: RegExp }> = [
    { id: 'stranger', patterns: /first time|never visited|new to|stranger/i },
    { id: 'champion', patterns: /loyal|champion|advocate|regular customer/i },
    { id: 'regular', patterns: /regular|comes back|frequent/i },
    { id: 'beginner', patterns: /beginner|just started|new customer/i },
    { id: 'rejoiner', patterns: /rejoin|come back|lapsed|win back/i },
    { id: 'explorer', patterns: /explor|research|compare|browse/i },
  ];
  for (const row of ordered) {
    if (!allowed.includes(row.id)) continue;
    if (row.patterns.test(text)) return row.id;
  }
  return pickRandomEngagementLevel(allowed, random);
}

function pickIntent(
  segmentId: string,
  catalog: SamStoryPlanCatalogSnapshotV1,
  hint?: string,
  random?: () => number,
): string {
  if (hint?.trim() && catalog.intentIds.includes(hint.trim())) {
    return hint.trim();
  }
  const segment = catalog.segments.find((row) => row.id === segmentId);
  const pool = segment?.intentIds.length ? segment.intentIds : catalog.intentIds;
  const picked = pickRandomFrom(pool, random ?? Math.random);
  if (!picked) {
    throw new Error('No intents available in org catalog');
  }
  return picked;
}

const SEGMENT_SCENARIO_MATCH_THRESHOLD = 0.12;

function pickSegmentId(
  scenario: string,
  segments: SamStoryPlanCatalogSnapshotV1['segments'],
  explicit?: string,
  random?: () => number,
): string {
  const trimmed = explicit?.trim();
  if (trimmed) {
    return trimmed;
  }
  let best = segments[0]!;
  let bestScore = -1;
  for (const segment of segments) {
    const corpus = [
      segment.id,
      segment.label,
      segment.topic,
      segment.needsSummary,
      segment.intentIds.join(' '),
    ]
      .filter(Boolean)
      .join(' ');
    const score = Math.max(
      scoreScenarioTokenOverlap(scenario, corpus),
      scoreScenarioTokenOverlap(scenario, segment.id),
      scoreScenarioTokenOverlap(scenario, segment.label ?? ''),
    );
    if (score > bestScore) {
      bestScore = score;
      best = segment;
    }
  }
  if (bestScore >= SEGMENT_SCENARIO_MATCH_THRESHOLD) {
    return best.id;
  }
  const picked = pickRandomFrom(segments, random ?? Math.random);
  return picked?.id ?? best.id;
}

export function planStoryCreateHeuristic(input: {
  scenario: string;
  catalog: SamStoryPlanCatalogSnapshotV1;
  segmentId?: string;
  storeSlug?: string;
  engagementLevelId?: string;
  intentId?: string;
  random?: () => number;
  seed?: string | number;
}): SamStoryPlanHeuristicSelectionV1 {
  const scenario = input.scenario.trim();
  if (input.catalog.segments.length === 0) {
    throw new Error('Org AXM catalog has no segments — publish segment catalog first');
  }

  const explicitSegmentId = input.segmentId?.trim();
  if (explicitSegmentId && !input.catalog.segments.some((row) => row.id === explicitSegmentId)) {
    throw new Error(`segmentId "${explicitSegmentId}" is not in org axm catalog`);
  }
  const random = resolveStoryPlanRandom({ random: input.random, seed: input.seed });
  const segmentId = pickSegmentId(
    scenario,
    input.catalog.segments,
    explicitSegmentId,
    random,
  );

  const places = input.catalog.fleetPlaces;
  let storeSlug = input.storeSlug?.trim();
  if (storeSlug && !places.some((row) => row.slug === storeSlug)) {
    throw new Error(`storeSlug "${storeSlug}" is not in org fleet catalog`);
  }
  if (!storeSlug && places.length > 0) {
    let best: (typeof places)[number] | undefined;
    let bestScore = 0;
    for (const place of places) {
      const score = scoreFleetPlaceScenarioMatch(scenario, place);
      if (score > bestScore) {
        bestScore = score;
        best = place;
      }
    }
    if (best && bestScore >= 0.35) {
      storeSlug = best.slug;
    } else {
      storeSlug = pickRandomStoryPlanStoreSlug(places, random);
    }
  }

  if (input.catalog.engagementLevelIds.length === 0) {
    throw new Error('Org customer catalog has no engagement levels');
  }
  const engagementLevelId = pickEngagement(scenario, input.catalog.engagementLevelIds, random);
  const resolvedEngagement = input.engagementLevelId ?? engagementLevelId;
  const intentId = pickIntent(segmentId, input.catalog, input.intentId, random);

  const segmentLabel = input.catalog.segments.find((row) => row.id === segmentId)?.label;
  const storeName = places.find((row) => row.slug === storeSlug)?.name;

  return {
    segmentId,
    storeSlug,
    engagementLevelId: resolvedEngagement,
    intentIds: [intentId],
    rationale:
      `Heuristic match: segment \`${segmentId}\`${segmentLabel ? ` (${segmentLabel})` : ''}` +
      `${storeSlug ? `, store \`${storeSlug}\`${storeName ? ` (${storeName})` : ''}` : ''}` +
      `, engagement \`${resolvedEngagement}\`, intent \`${intentId}\`.`,
  };
}
