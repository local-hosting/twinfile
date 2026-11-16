import { briefSection, joinBriefSections } from './format-brief.js';
import type { BriefV1, StoryBriefCharacterV1 } from './types.js';

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
    ...(psych?.pcmId ? [`PCM \`${psych.pcmId}\``] : []),
    ...(psych?.segmentId
      ? [`Segment \`${psych.segmentId}\`${psych.segmentLabel ? ` (${psych.segmentLabel})` : ''}`]
      : []),
    ...(psych?.mindset ? [`Mindset: ${psych.mindset}`] : []),
    ...(psych?.traits?.length ? [`Traits: ${psych.traits.join(', ')}`] : []),
  ];
  const storyBullets: string[] =
    character.storyIds && character.storyIds.length > 0
      ? character.storyIds.map((id) => `Episode \`${id}\``)
      : ['No story episodes linked in catalog yet'];

  return joinBriefSections(`Character — ${name}`, [
    briefSection('Demography', identityBullets),
    briefSection('Psychography', psychologyBullets),
    briefSection('Stories', storyBullets),
  ]);
}
