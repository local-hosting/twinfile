import type { CellCommunityInterestV1, CellCommunityMindsetV1, CellCommunityMotivationV1 } from './cell-audience.js';
import type { SegmentInterestV1 } from './segment-interests.schema.js';
import type { SegmentMindsetV1 } from './segment-mindset.schema.js';
import type { SegmentMotivationV1, SegmentReachabilityV1 } from './segment-motivation.schema.js';
import type { SegmentAffinityMember } from './segment-affinity-member.js';

type WeightedText = { text: string; weight: number };

function addWeightedText(map: Map<string, WeightedText>, text: string, weight: number): void {
  const trimmed = text.trim();
  if (!trimmed || weight <= 0) return;
  const existing = map.get(trimmed);
  if (existing) {
    existing.weight += weight;
    return;
  }
  map.set(trimmed, { text: trimmed, weight });
}

function topWeightedTexts(map: Map<string, WeightedText>, limit: number): string[] {
  return [...map.values()]
    .sort((a, b) => b.weight - a.weight || a.text.localeCompare(b.text))
    .slice(0, limit)
    .map((row) => row.text);
}

function blendMindset(
  members: readonly SegmentAffinityMember[],
): CellCommunityMindsetV1 | undefined {
  const think = new Map<string, WeightedText>();
  const feelPositive = new Map<string, WeightedText>();
  const feelNegative = new Map<string, WeightedText>();
  const beliefs = new Map<string, WeightedText>();

  for (const member of members) {
    const mindset = member.mindset;
    if (!mindset) continue;
    const weight = member.affinityShare;
    for (const text of mindset.think) addWeightedText(think, text, weight);
    for (const text of mindset.feel.positive) addWeightedText(feelPositive, text, weight);
    for (const text of mindset.feel.negative) addWeightedText(feelNegative, text, weight);
    for (const belief of mindset.beliefs) {
      addWeightedText(beliefs, belief.statement, weight * belief.strength);
    }
  }

  const blendedThink = topWeightedTexts(think, 6);
  const blendedPositive = topWeightedTexts(feelPositive, 5);
  const blendedNegative = topWeightedTexts(feelNegative, 5);
  const blendedBeliefs = [...beliefs.values()]
    .sort((a, b) => b.weight - a.weight || a.text.localeCompare(b.text))
    .slice(0, 6)
    .map((row) => ({ statement: row.text, strength: row.weight }));

  if (
    blendedThink.length === 0 &&
    blendedPositive.length === 0 &&
    blendedNegative.length === 0 &&
    blendedBeliefs.length === 0
  ) {
    return undefined;
  }

  return {
    think: blendedThink,
    feel: { positive: blendedPositive, negative: blendedNegative },
    beliefs: blendedBeliefs,
  };
}

type WeightedInterest = CellCommunityInterestV1 & {
  themeWeights: Map<string, number>;
};

function addInterest(
  map: Map<string, WeightedInterest>,
  interest: SegmentInterestV1,
  weight: number,
): void {
  if (weight <= 0) return;
  const existing = map.get(interest.id);
  if (existing) {
    existing.affinityShare += weight;
    for (const theme of interest.themes) {
      existing.themeWeights.set(theme, (existing.themeWeights.get(theme) ?? 0) + weight);
    }
    return;
  }

  const themeWeights = new Map<string, number>();
  for (const theme of interest.themes) {
    themeWeights.set(theme, weight);
  }
  map.set(interest.id, {
    id: interest.id,
    label: interest.label,
    affinityShare: weight,
    themes: [...interest.themes],
    themeWeights,
  });
}

function blendReach(members: readonly SegmentAffinityMember[]): SegmentReachabilityV1 | undefined {
  const adChannels = new Map<string, WeightedText>();
  const purchaseChannels = new Map<string, WeightedText>();
  const questions = new Map<string, WeightedText>();

  for (const member of members) {
    const reach = member.motivation?.reach;
    if (!reach) continue;
    const weight = member.affinityShare;
    for (const label of reach.topAdChannels) addWeightedText(adChannels, label, weight);
    for (const label of reach.preferredPurchaseChannels) {
      addWeightedText(purchaseChannels, label, weight);
    }
    for (const label of reach.topQuestions) addWeightedText(questions, label, weight);
  }

  const blended: SegmentReachabilityV1 = {
    topAdChannels: topWeightedTexts(adChannels, 4),
    preferredPurchaseChannels: topWeightedTexts(purchaseChannels, 3),
    topQuestions: topWeightedTexts(questions, 4),
  };

  if (
    blended.topAdChannels.length === 0 &&
    blended.preferredPurchaseChannels.length === 0 &&
    blended.topQuestions.length === 0
  ) {
    return undefined;
  }
  return blended;
}

function blendMotivation(
  members: readonly SegmentAffinityMember[],
): CellCommunityMotivationV1 | undefined {
  const visitDrivers = new Map<string, WeightedText>();
  const purchaseDrivers = new Map<string, WeightedText>();
  const switchingTriggers = new Map<string, WeightedText>();
  const messagingHooks = new Map<string, WeightedText>();
  const barriers = new Map<string, WeightedText>();

  for (const member of members) {
    const motivation = member.motivation;
    if (!motivation) continue;
    const weight = member.affinityShare;
    for (const text of motivation.visitDrivers) addWeightedText(visitDrivers, text, weight);
    for (const text of motivation.purchaseDrivers) addWeightedText(purchaseDrivers, text, weight);
    for (const text of motivation.switchingTriggers) addWeightedText(switchingTriggers, text, weight);
    for (const text of motivation.messagingHooks) addWeightedText(messagingHooks, text, weight);
    for (const text of motivation.barriers) addWeightedText(barriers, text, weight);
  }

  const blended: CellCommunityMotivationV1 = {
    visitDrivers: topWeightedTexts(visitDrivers, 6),
    purchaseDrivers: topWeightedTexts(purchaseDrivers, 6),
    switchingTriggers: topWeightedTexts(switchingTriggers, 4),
    messagingHooks: topWeightedTexts(messagingHooks, 6),
    barriers: topWeightedTexts(barriers, 4),
    reach: blendReach(members),
  };

  if (
    blended.visitDrivers.length === 0 &&
    blended.purchaseDrivers.length === 0 &&
    blended.switchingTriggers.length === 0 &&
    blended.messagingHooks.length === 0 &&
    blended.barriers.length === 0
  ) {
    return undefined;
  }
  return blended;
}

export function attachSegmentMindsets<T extends SegmentAffinityMember>(input: {
  composition: T[];
  segments?: Record<string, { mindset?: SegmentMindsetV1 }>;
}): T[] {
  if (!input.segments) return input.composition;
  return input.composition.map((member) => {
    const mindset = input.segments?.[member.segmentId]?.mindset;
    return mindset ? { ...member, mindset } : member;
  });
}

export function buildCommunityMindset(
  composition: readonly SegmentAffinityMember[],
): CellCommunityMindsetV1 | undefined {
  return blendMindset(composition);
}

export function attachSegmentInterests<T extends SegmentAffinityMember>(input: {
  composition: T[];
  segments?: Record<string, { interests?: SegmentInterestV1[] }>;
}): T[] {
  if (!input.segments) return input.composition;
  return input.composition.map((member) => {
    const interests = input.segments?.[member.segmentId]?.interests;
    return interests?.length ? { ...member, interests } : member;
  });
}

export function buildCommunityInterests(
  composition: readonly SegmentAffinityMember[],
): CellCommunityInterestV1[] {
  const weighted = new Map<string, WeightedInterest>();

  for (const member of composition) {
    const interests = member.interests;
    if (!interests?.length) continue;
    const perInterestWeight = member.affinityShare / interests.length;
    for (const interest of interests) {
      addInterest(weighted, interest, perInterestWeight);
    }
  }

  return [...weighted.values()]
    .sort((a, b) => b.affinityShare - a.affinityShare || a.label.localeCompare(b.label))
    .slice(0, 10)
    .map(({ id, label, affinityShare, themes }) => ({ id, label, affinityShare, themes }));
}

export function topCommunityInterestThemes(
  interests: readonly CellCommunityInterestV1[],
  limit = 6,
): string[] {
  const themeWeights = new Map<string, number>();
  for (const interest of interests) {
    const share = interest.affinityShare;
    if (share <= 0) continue;
    for (const theme of interest.themes) {
      themeWeights.set(theme, (themeWeights.get(theme) ?? 0) + share);
    }
  }
  return [...themeWeights.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([theme]) => theme);
}

export function attachSegmentMotivations<T extends SegmentAffinityMember>(input: {
  composition: T[];
  segments?: Record<string, { motivation?: SegmentMotivationV1 }>;
}): T[] {
  if (!input.segments) return input.composition;
  return input.composition.map((member) => {
    const motivation = input.segments?.[member.segmentId]?.motivation;
    return motivation ? { ...member, motivation } : member;
  });
}

export function buildCommunityMotivation(
  composition: readonly SegmentAffinityMember[],
): CellCommunityMotivationV1 | undefined {
  return blendMotivation(composition);
}
