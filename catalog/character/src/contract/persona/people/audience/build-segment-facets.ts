import type { InterestTypeCatalog } from './interest-type.schema.js';
import type { PsychographicSegmentProfile } from '../customer/profile/customer.js';
import type { SegmentBeliefV1, SegmentMindsetV1 } from './segment-mindset.schema.js';
import type { SegmentInterestV1 } from './segment-interests.schema.js';
import type { SegmentMotivationV1, SegmentReachabilityV1 } from './segment-motivation.schema.js';
import type { CulturalCompositionEntryV1, SegmentCulturalProfileV1 } from './segment-cultural-profile.schema.js';

const VISIT_PURCHASE_PHASES = new Set([
  'Awareness',
  'Decision to Visit',
  'Prep for Visit',
  'Arrival',
  'Engage',
]);

const SWITCHING_TRIGGER_MIN_PCT = 30;
const REACH_MIN_PCT = 25;

export type SegmentEmpathyExemplarV1 = {
  think: string[];
  feel: SegmentMindsetV1['feel'];
  visitActions?: string[];
};

function uniqueStrings(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const rows: string[] = [];
  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    rows.push(trimmed);
  }
  return rows;
}

function topPctLabels(map: Record<string, number> | undefined, minPct: number, limit: number): string[] {
  if (!map) return [];
  return Object.entries(map)
    .filter(([, pct]) => pct >= minPct)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([label]) => label);
}

export function beliefsFromAttitudes(profile: PsychographicSegmentProfile): SegmentBeliefV1[] {
  const attitudeScales = profile.attitudes?.attitudes?.attitudeScales;
  if (!attitudeScales) return [];

  const beliefs: SegmentBeliefV1[] = [];
  for (const domain of ['tech', 'telecom'] as const) {
    const items = attitudeScales[domain];
    if (!items) continue;
    for (const [id, item] of Object.entries(items)) {
      if (!item) continue;
      if (item.value >= 0.55) {
        beliefs.push({
          id: `${domain}.${id}`,
          statement: item.highStatement,
          strength: item.value,
        });
      } else if (item.value <= 0.45) {
        beliefs.push({
          id: `${domain}.${id}`,
          statement: item.lowStatement,
          strength: 1 - item.value,
        });
      }
    }
  }

  return beliefs.sort((a, b) => b.strength - a.strength);
}

export function mindsetFromEmpathy(
  profile: PsychographicSegmentProfile,
  exemplar?: Pick<SegmentEmpathyExemplarV1, 'think' | 'feel'>,
): { think: string[]; feel: SegmentMindsetV1['feel'] } {
  const think: string[] = [];
  const feelPositive: string[] = [];
  const feelNegative: string[] = [];
  const empathy = profile.empathy?.empathy;

  if (empathy?.feelings) {
    feelPositive.push(...empathy.feelings.positive);
    feelNegative.push(...empathy.feelings.negative);
  }

  for (const channel of ['sales', 'service'] as const) {
    const phases = empathy?.phases?.[channel];
    if (!phases) continue;
    for (const phase of Object.values(phases)) {
      think.push(...phase.thinking);
      feelPositive.push(...(phase.feeling?.positive ?? []));
      feelNegative.push(...(phase.feeling?.negative ?? []));
    }
  }

  if (exemplar) {
    think.push(...exemplar.think);
    feelPositive.push(...exemplar.feel.positive);
    feelNegative.push(...exemplar.feel.negative);
  }

  return {
    think: uniqueStrings(think),
    feel: {
      positive: uniqueStrings(feelPositive),
      negative: uniqueStrings(feelNegative),
    },
  };
}

export function buildSegmentMindsetFromProfile(
  profile: PsychographicSegmentProfile,
  exemplar?: Pick<SegmentEmpathyExemplarV1, 'think' | 'feel'>,
): SegmentMindsetV1 | undefined {
  const { think, feel } = mindsetFromEmpathy(profile, exemplar);
  const beliefs = beliefsFromAttitudes(profile);

  if (think.length === 0 && feel.positive.length === 0 && feel.negative.length === 0 && beliefs.length === 0) {
    return undefined;
  }

  return {
    think: think.slice(0, 8),
    feel: {
      positive: feel.positive.slice(0, 6),
      negative: feel.negative.slice(0, 6),
    },
    beliefs: beliefs.slice(0, 8),
  };
}

export function resolveSegmentInterests(
  ids: readonly string[],
  catalog: InterestTypeCatalog,
): SegmentInterestV1[] {
  const byId = new Map(catalog.types.map((row) => [row.id, row]));
  const resolved: SegmentInterestV1[] = [];

  for (const id of ids) {
    const row = byId.get(id);
    if (!row) continue;
    resolved.push({
      id: row.id,
      label: row.label,
      ...(row.slug ? { slug: row.slug } : {}),
      themes: [...(row.themes ?? [])],
      ...(row.description ? { description: row.description } : {}),
    });
  }

  return resolved;
}

function visitPhaseMotivation(profile: PsychographicSegmentProfile): {
  visitDrivers: string[];
  messagingHooks: string[];
  barriers: string[];
} {
  const visitDrivers: string[] = [];
  const messagingHooks: string[] = [];
  const barriers: string[] = [];
  const empathy = profile.empathy?.empathy;

  for (const channel of ['sales', 'service'] as const) {
    const phases = empathy?.phases?.[channel];
    if (!phases) continue;
    for (const [phaseId, phase] of Object.entries(phases)) {
      if (!VISIT_PURCHASE_PHASES.has(phaseId)) continue;
      visitDrivers.push(...phase.thinking);
      messagingHooks.push(...(phase.saying?.positive ?? []));
      barriers.push(...(phase.saying?.negative ?? []));
    }
  }

  return {
    visitDrivers: uniqueStrings(visitDrivers),
    messagingHooks: uniqueStrings(messagingHooks),
    barriers: uniqueStrings(barriers),
  };
}

function purchaseMotivation(profile: PsychographicSegmentProfile): {
  purchaseDrivers: string[];
  switchingTriggers: string[];
  reach?: SegmentReachabilityV1;
} {
  const purchaseDrivers: string[] = [];
  const behavior = profile.behavior?.behavior;
  const strategy = profile.strategy?.strategy;

  for (const row of behavior?.purchaseFactors?.topFactors ?? []) {
    purchaseDrivers.push(row.factor);
  }
  purchaseDrivers.push(...(behavior?.purchaseFactors?.uniqueNuances ?? []));
  purchaseDrivers.push(...(strategy?.acquisition?.strategies ?? []));
  purchaseDrivers.push(...(strategy?.retention?.strategies ?? []));

  const switchingTriggers = topPctLabels(
    behavior?.switchingBehavior?.triggers,
    SWITCHING_TRIGGER_MIN_PCT,
    6,
  );

  const reach: SegmentReachabilityV1 = {
    topAdChannels: topPctLabels(behavior?.reachability?.advertisingAttention, REACH_MIN_PCT, 4),
    preferredPurchaseChannels: topPctLabels(
      behavior?.reachability?.preferredPurchaseChannel,
      REACH_MIN_PCT,
      3,
    ),
    topQuestions: topPctLabels(behavior?.reachability?.questionsTheyHave, REACH_MIN_PCT, 4),
  };

  const hasReach =
    reach.topAdChannels.length > 0 ||
    reach.preferredPurchaseChannels.length > 0 ||
    reach.topQuestions.length > 0;

  return {
    purchaseDrivers: uniqueStrings(purchaseDrivers),
    switchingTriggers,
    ...(hasReach ? { reach } : {}),
  };
}

export function buildSegmentMotivationFromProfile(
  profile: PsychographicSegmentProfile,
  exemplarVisitActions: readonly string[] = [],
): SegmentMotivationV1 | undefined {
  const visit = visitPhaseMotivation(profile);
  const purchase = purchaseMotivation(profile);

  const visitDrivers = uniqueStrings([...visit.visitDrivers, ...exemplarVisitActions]);
  const barriers = uniqueStrings([
    ...visit.barriers,
    ...topPctLabels(profile.behavior?.behavior?.switchingBehavior?.barriers, SWITCHING_TRIGGER_MIN_PCT, 4),
  ]);

  if (
    visitDrivers.length === 0 &&
    purchase.purchaseDrivers.length === 0 &&
    purchase.switchingTriggers.length === 0 &&
    visit.messagingHooks.length === 0 &&
    barriers.length === 0
  ) {
    return undefined;
  }

  return {
    visitDrivers: visitDrivers.slice(0, 8),
    purchaseDrivers: purchase.purchaseDrivers.slice(0, 8),
    switchingTriggers: purchase.switchingTriggers.slice(0, 6),
    messagingHooks: visit.messagingHooks.slice(0, 8),
    barriers: barriers.slice(0, 6),
    ...(purchase.reach ? { reach: purchase.reach } : {}),
  };
}

export function ethnicityFromAttributeMap(
  raw: unknown,
  labels: Readonly<Record<string, string>> = {},
): CulturalCompositionEntryV1[] {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return [];
  const rows: CulturalCompositionEntryV1[] = [];
  for (const [id, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) continue;
    rows.push({
      id,
      label: labels[id] ?? id.replace(/_/g, ' '),
      sharePct: value,
    });
  }
  return rows.sort((a, b) => b.sharePct - a.sharePct || a.label.localeCompare(b.label));
}

export function buildSegmentCulturalProfileFromEthnicity(
  ethnicity: readonly CulturalCompositionEntryV1[],
): SegmentCulturalProfileV1 | undefined {
  if (ethnicity.length === 0) return undefined;
  return { ethnicity: [...ethnicity] };
}
