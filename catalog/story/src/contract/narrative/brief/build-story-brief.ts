import { briefSection, joinBriefSections } from './format-brief.js';
import type {
  BriefV1,
  StoryBriefCharacterV1,
  StoryBriefHowV1,
  StoryBriefSnapshotV1,
  StoryBriefWhatV1,
  StoryBriefWhenV1,
  StoryBriefWhereV1,
  StoryBriefWhoV1,
  StoryBriefWhyV1,
} from './types.js';

function formatWhoBullets(who: StoryBriefWhoV1 | undefined): string[] {
  if (!who) return ['No `who` dimension on story'];
  return [
    ...(who.segmentId ? [`Segment \`${who.segmentId}\``] : []),
    ...(who.characterId ? [`Character \`${who.characterId}\``] : []),
  ];
}

function formatWhatBullets(what: StoryBriefWhatV1 | undefined): string[] {
  if (!what) return ['No `what` dimension on story'];
  return [
    ...(what.storyId ? [`Story twin \`${what.storyId}\``] : []),
    ...(what.startStoreVisitJourney === true ? ['Store-visit journey started'] : []),
    ...(what.startStoreVisitJourney === false ? ['Store-visit journey not started'] : []),
  ];
}

function formatWhereBullets(where: StoryBriefWhereV1 | undefined): string[] {
  if (!where) return ['No `where` dimension on story'];
  return [
    ...(where.storeSlug ? [`Store \`${where.storeSlug}\``] : []),
    ...(where.placeSlug ? [`Place \`${where.placeSlug}\``] : []),
    ...(typeof where.lat === 'number' && typeof where.lon === 'number'
      ? [`Coordinates ${where.lat}, ${where.lon}`]
      : []),
    ...(where.h3Cell ? [`H3 \`${where.h3Cell}\``] : []),
    ...(where.zip ? [`ZIP ${where.zip}`] : []),
    ...(where.dma ? [`DMA ${where.dma}`] : []),
  ];
}

function formatEpisodeTouchpointLine(
  touchpointIds: readonly string[],
): string | undefined {
  const ids = touchpointIds.map((id) => id.trim()).filter(Boolean);
  if (ids.length === 0) return undefined;
  return `Episode touchpoints (${ids.length}): ${ids.map((id) => `\`${id}\``).join(' → ')}`;
}

function formatStoryArcBullets(when: StoryBriefWhenV1 | undefined): string[] {
  const arc = when?.storyArc;
  if (!arc) return [];
  const pre = arc.phases.pre_visit;
  const post = arc.phases.post_visit;
  const touchpointLine = formatEpisodeTouchpointLine(arc.objectiveTouchpointIds);
  return [
    `${arc.planningHorizonDays}-day episode from ${arc.simulationEpochStart}`,
    `Pre-visit days ${pre.startDayIndex}–${pre.endDayIndex}`,
    `Primary moment day ${arc.visitDayIndex}`,
    `Post-visit days ${post.startDayIndex}–${post.endDayIndex}`,
    ...(touchpointLine ? [touchpointLine] : []),
  ];
}

function formatWhenBullets(when: StoryBriefWhenV1 | undefined): string[] {
  if (!when) return ['No `when` dimension on story'];
  return [
    ...(when.simulationEpochStart ? [`Epoch start ${when.simulationEpochStart}`] : []),
    ...(when.planningHorizonDays != null
      ? [`Planning horizon ${when.planningHorizonDays} days`]
      : []),
    ...(when.useFeedCalendar === true ? ['Uses org feed calendar for timing'] : []),
    ...(when.useFeedCalendar === false ? ['Feed calendar disabled'] : []),
    ...formatStoryArcBullets(when),
  ];
}

function formatWhyBullets(why: StoryBriefWhyV1 | undefined): string[] {
  if (!why) return ['No `why` dimension on story'];
  return [
    ...(why.engagementLevelId ? [`Engagement \`${why.engagementLevelId}\``] : []),
    ...(why.intentIds?.length ? [`Intents: ${why.intentIds.map((id) => `\`${id}\``).join(', ')}`] : []),
    ...(why.focusAreaId ? [`Focus \`${why.focusAreaId}\``] : []),
    ...(why.interestIds?.length
      ? [`Interests: ${why.interestIds.map((id) => `\`${id}\``).join(', ')}`]
      : []),
  ];
}

function formatHowBullets(how: StoryBriefHowV1 | undefined): string[] {
  if (!how) {
    return ['Configured via Character persona / segment mounts'];
  }
  return [
    ...(how.journeyPace?.trim() ? [`Pace \`${how.journeyPace.trim()}\``] : []),
    ...(how.dramaticBeatIds?.length
      ? [`Beats: ${how.dramaticBeatIds.map((id) => `\`${id}\``).join(', ')}`]
      : []),
    ...(how.segmentPresetId?.trim() ? [`Preset \`${how.segmentPresetId.trim()}\``] : []),
  ];
}

export function buildStoryBrief(input: {
  snapshot: StoryBriefSnapshotV1;
  character?: StoryBriefCharacterV1;
}): BriefV1 {
  const { snapshot, character } = input;
  const storyId = snapshot.storyId?.trim() || character?.personaId || 'story';
  const characterName = character?.name?.trim() || snapshot.personaId || character?.personaId;

  const headline = characterName
    ? `Story — ${storyId} (${characterName})`
    : `Story — ${storyId}`;

  const metaBullets = snapshot.personaId ? [`Persona \`${snapshot.personaId}\``] : [];

  const pitchBullets = snapshot.storyPitch ? [snapshot.storyPitch] : [];

  const characterBullets = character
    ? [
        ...(character.name ? [`Name ${character.name}`] : []),
        ...(character.psychology?.segmentId
          ? [`Segment \`${character.psychology.segmentId}\``]
          : []),
        ...(character.age != null ? [`Age ${character.age}`] : []),
      ]
    : [];

  return joinBriefSections(headline, [
    ...(metaBullets.length > 0 ? [briefSection('Episode', metaBullets)] : []),
    ...(pitchBullets.length > 0 ? [briefSection('Pitch', pitchBullets)] : []),
    ...(characterBullets.length > 0 ? [briefSection('Character', characterBullets)] : []),
    briefSection('Who', formatWhoBullets(snapshot.who)),
    briefSection('What', formatWhatBullets(snapshot.what)),
    briefSection('Where', formatWhereBullets(snapshot.where)),
    briefSection('When', formatWhenBullets(snapshot.when)),
    briefSection('Why', formatWhyBullets(snapshot.why)),
    briefSection('How', formatHowBullets(snapshot.how)),
  ]);
}
