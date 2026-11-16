import { briefSection, joinBriefSections } from './format-brief.js';
import type { BriefV1, StoryBriefCharacterV1, StoryBriefPersonalityV1 } from './types.js';

function personalityBullets(personality: StoryBriefPersonalityV1 | undefined): string[] {
  if (!personality) return [];
  const deliveryPatterns = personality.delivery?.patterns?.filter(Boolean) ?? [];
  const deliveryLines = personality.delivery?.lines?.filter(Boolean) ?? [];
  return [
    ...(personality.wants ? [`Wants: ${personality.wants}`] : []),
    ...(personality.fears ? [`Fears: ${personality.fears}`] : []),
    ...(personality.flaw ? [`Flaw: ${personality.flaw}`] : []),
    ...(deliveryPatterns.length ? [`Delivery: ${deliveryPatterns.join('; ')}`] : []),
    ...(deliveryLines.length ? [`Lines: ${deliveryLines.map((line) => `“${line}”`).join(' ')}`] : []),
    ...(personality.movement?.length ? [`Movement: ${personality.movement.join('; ')}`] : []),
    ...(personality.temperament?.length ? [`Temperament: ${personality.temperament.join('; ')}`] : []),
    ...(personality.moods?.length ? [`Moods: ${personality.moods.join('; ')}`] : []),
    ...(personality.signatureMoves?.length
      ? [`Signature moves: ${personality.signatureMoves.join('; ')}`]
      : []),
  ];
}

export function buildCharacterBrief(input: { character: StoryBriefCharacterV1 }): BriefV1 {
  const { character } = input;
  const name = character.name?.trim() || character.personaId;
  const psych = character.psychology;
  const identityBullets: string[] = [
    `Persona id \`${character.personaId}\``,
    ...(character.actorDid ? [`Actor \`${character.actorDid}\``] : []),
    ...(character.age != null ? [`Age ${character.age}`] : []),
    ...(character.householdSize != null ? [`Household size ${character.householdSize}`] : []),
    ...(character.occupation ? [`Occupation: ${character.occupation}`] : []),
  ];
  const psychologyBullets: string[] = [
    ...(psych?.characterId ? [`Character \`${psych.characterId}\``] : []),
    ...(psych?.segmentId
      ? [`Segment \`${psych.segmentId}\`${psych.segmentLabel ? ` (${psych.segmentLabel})` : ''}`]
      : []),
    ...(psych?.mindset ? [`Mindset: ${psych.mindset}`] : []),
    ...(psych?.traits?.length ? [`Traits: ${psych.traits.join(', ')}`] : []),
  ];
  const dramaturgyBullets = personalityBullets(psych?.personality);
  const storyBullets: string[] =
    character.storyIds && character.storyIds.length > 0
      ? character.storyIds.map((id) => `Story \`${id}\``)
      : ['No Story twins linked in catalog yet'];

  return joinBriefSections(`Character — ${name}`, [
    briefSection('Demography', identityBullets),
    briefSection('Psychography', psychologyBullets),
    ...(dramaturgyBullets.length ? [briefSection('Personality', dramaturgyBullets)] : []),
    briefSection('Stories', storyBullets),
  ]);
}
