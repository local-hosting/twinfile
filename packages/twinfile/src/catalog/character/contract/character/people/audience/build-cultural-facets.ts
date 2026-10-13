import type { CellCommunityInterestV1, CellCulturalIdentityV1 } from './cell-audience.js';
import type { CulturalCompositionEntryV1, SegmentCulturalProfileV1 } from './segment-cultural-profile.schema.js';
import type { SegmentAffinityMember } from './segment-affinity-member.js';

export function blendMemberEthnicity(
  composition: readonly SegmentAffinityMember[],
  segments?: Record<string, { culturalProfile?: SegmentCulturalProfileV1 }>,
): CulturalCompositionEntryV1[] | undefined {
  if (!segments) return undefined;
  const weighted = new Map<string, CulturalCompositionEntryV1>();

  for (const member of composition) {
    const ethnicity = segments[member.segmentId]?.culturalProfile?.ethnicity;
    if (!ethnicity?.length) continue;
    for (const entry of ethnicity) {
      const weight = (member.affinityShare * entry.sharePct) / 100;
      const existing = weighted.get(entry.id);
      if (existing) {
        existing.sharePct += weight * 100;
        continue;
      }
      weighted.set(entry.id, {
        id: entry.id,
        label: entry.label,
        sharePct: weight * 100,
      });
    }
  }

  const rows = [...weighted.values()]
    .sort((a, b) => b.sharePct - a.sharePct || a.label.localeCompare(b.label))
    .slice(0, 6);
  return rows.length > 0 ? rows : undefined;
}

export function buildCulturalImplications(input: {
  residentEthnicity: readonly CulturalCompositionEntryV1[];
  language?: { label: string; sharePct?: number };
  generation?: { label: string; sharePct?: number };
  interests?: readonly CellCommunityInterestV1[];
}): string[] {
  const implications: string[] = [];
  const topResident = input.residentEthnicity[0];
  const hispanic = input.residentEthnicity.find((row) => row.id === 'hispanic');
  const black = input.residentEthnicity.find((row) => row.id === 'black');
  const asian = input.residentEthnicity.find((row) => row.id === 'asian');

  if (hispanic && hispanic.sharePct >= 20) {
    implications.push(
      'Bilingual and Spanish-language touchpoints may improve trust and conversion in this trade area.',
    );
  }
  if (black && black.sharePct >= 25) {
    implications.push(
      'Community-rooted messaging and local partnership cues often resonate with this population mix.',
    );
  }
  if (asian && asian.sharePct >= 12) {
    implications.push(
      'Premium tech, speed, and innovation proof points tend to index with this resident profile.',
    );
  }
  if (input.language?.label.toLowerCase().includes('spanish') && (input.language.sharePct ?? 0) >= 10) {
    implications.push('Spanish-language service and in-store support can reduce friction.');
  }
  if (input.generation?.label.match(/gen z|millennial/i)) {
    implications.push('Mobile-first journeys and app self-service align with the dominant generation cohort.');
  }
  if (topResident && topResident.sharePct >= 40) {
    implications.push(
      `Creative featuring ${topResident.label} households may feel more locally authentic.`,
    );
  }

  const interestLabels = new Set((input.interests ?? []).map((row) => row.label.toLowerCase()));
  if (hispanic && hispanic.sharePct >= 20 && interestLabels.has('kids & family programming')) {
    implications.push('Family and multi-generational household offers may connect cultural identity with product interest.');
  }
  if (interestLabels.has('gaming') && (asian?.sharePct ?? 0) >= 10) {
    implications.push('Low-latency internet and gaming bundles align with local identity and stated interests.');
  }

  return [...new Set(implications)].slice(0, 5);
}

export function assembleCulturalIdentity(input: {
  residentEthnicity: readonly CulturalCompositionEntryV1[];
  language?: { label: string; sharePct?: number };
  generation?: { label: string; sharePct?: number };
  memberEthnicity?: readonly CulturalCompositionEntryV1[];
  interests?: readonly CellCommunityInterestV1[];
}): CellCulturalIdentityV1 | undefined {
  if (
    input.residentEthnicity.length === 0 &&
    !input.language &&
    !input.generation &&
    !input.memberEthnicity?.length
  ) {
    return undefined;
  }

  const implications = buildCulturalImplications({
    residentEthnicity: input.residentEthnicity,
    ...(input.language ? { language: input.language } : {}),
    ...(input.generation ? { generation: input.generation } : {}),
    ...(input.interests ? { interests: input.interests } : {}),
  });

  return {
    residentEthnicity: [...input.residentEthnicity],
    ...(input.language ? { language: input.language } : {}),
    ...(input.generation ? { generation: input.generation } : {}),
    ...(input.memberEthnicity ? { memberEthnicity: [...input.memberEthnicity] } : {}),
    implications,
  };
}
