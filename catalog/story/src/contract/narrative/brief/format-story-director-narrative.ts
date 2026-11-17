import type { EpisodeArcV1 } from '../types/episode-arc.js';
import type { StoryBriefSnapshotV1 } from './types.js';
import {
  buildStoryboardSceneContext,
  findStorySceneForTouchpoint,
  humanizeStoryWireLabel,
  humanizeToken,
} from './storyboard-scene-context.js';
import { resolveStoryEpisodePresentation } from './resolve-story-episode-presentation.js';
import {
  buildStorySituationsNarrativeContext,
  formatSituationsJobBullet,
} from './story-situations-narrative-context.js';
import { touchpointScriptScene } from './storyboard-touchpoint-scenes.js';
import { buildProtagonistWhoBlurbLines } from './protagonist-identity.js';
import { formatStoryReaderSynopsisLines } from './format-story-reader-synopsis.js';
import { resolveScenePlaceForReader } from './resolve-scene-place-for-reader.js';
import {
  formatDirectorArcParagraph,
  formatDirectorDenouementClosing,
  formatJobPursuitPhrase,
  resolveEffectiveEpisodeTiming,
} from './resolve-story-arc-narrative.js';
import { findDailyRhythmBlock, formatDailyRhythmClock } from './persona-daily-rhythm-format.js';
import type {
  DirectorScriptSceneV1,
  FormatStoryDirectorNarrativeInput,
  StoryboardPanelV1,
} from './storyboard-types.js';

export type {
  DirectorScriptSceneV1,
  FormatStoryDirectorNarrativeInput,
  StoryboardPanelV1,
} from './storyboard-types.js';
export { humanizeStoryWireLabel } from './storyboard-scene-context.js';
export {
  buildStoryboardSceneContext,
  findStorySceneForTouchpoint,
  serializeStoryboardLlmContext,
  type StoryboardSceneContextV1,
} from './storyboard-scene-context.js';

function formatCalendarDate(isoDate: string | undefined): string | undefined {
  const value = isoDate?.trim();
  if (!value) return undefined;
  const parsed = new Date(`${value}T12:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function resolveEpisodeTitle(input: FormatStoryDirectorNarrativeInput): string {
  const pitch = input.snapshot.storyPitch?.trim();
  if (pitch) return pitch.replace(/\.$/, '');
  const fromWhat = humanizeStoryWireLabel(input.snapshot.what?.storyId);
  if (fromWhat) return fromWhat;
  const storyId = input.snapshot.storyId?.trim();
  if (storyId) return humanizeToken(storyId);
  return 'Untitled episode';
}

function formatStoryboardPanel(panel: StoryboardPanelV1): string[] {
  return [
    '**Storyboard**',
    `- **Visual:** ${panel.visual}`,
    `- **Caption:** ${panel.caption}`,
    `- **Setting:** ${panel.setting}`,
    `- **Time:** ${panel.time}`,
    `- **Duration:** ${panel.duration}`,
    `- **Camera:** ${panel.camera}`,
    `- **Shot:** ${panel.shot}`,
    `- **Look:** ${panel.look}`,
    `- **Props:** ${panel.props}`,
  ];
}

function defaultScreenSeconds(touchpointId: string): number {
  const key = touchpointId.toLowerCase();
  if (key.includes('open-home')) return 28;
  if (key.includes('set-dest') || key.includes('choose-dest')) return 22;
  if (key.includes('confirm-dest')) return 18;
  if (key.includes('live-map') || key.includes('in-ride')) return 45;
  if (key.includes('store') || key.includes('visit')) return 55;
  return 30;
}

function formatStoryClockLabel(dayIndex: number, hour: number): string {
  const normalized = ((hour % 24) + 24) % 24;
  const hour12 = normalized % 12 === 0 ? 12 : normalized % 12;
  const period = normalized >= 12 ? 'PM' : 'AM';
  return `day ${dayIndex}, ${hour12}:00 ${period}`;
}

function resolveSceneDurationLabel(
  touchpointId: string,
  sceneIndex: number,
  orderedTouchpointIds: readonly string[],
  arc: EpisodeArcV1 | undefined,
): string {
  const screenSeconds = defaultScreenSeconds(touchpointId);
  const schedule = arc?.touchpointSchedule ?? [];
  const entry = schedule.find((row) => row.touchpointId.trim() === touchpointId.trim());
  const parts = [`~${screenSeconds} sec on screen`];

  if (entry) {
    parts.push(`story clock ${formatStoryClockLabel(entry.dayIndex, entry.hour)}`);
    const nextId = orderedTouchpointIds[sceneIndex + 1]?.trim();
    if (nextId) {
      const nextEntry = schedule.find((row) => row.touchpointId.trim() === nextId);
      if (nextEntry) {
        const hourDelta = (nextEntry.dayIndex - entry.dayIndex) * 24 + (nextEntry.hour - entry.hour);
        if (hourDelta > 0) {
          parts.push(`${hourDelta}h until next beat in simulation`);
        } else if (hourDelta === 0) {
          parts.push('same story hour as next beat');
        }
      }
    }
  }

  return parts.join(' · ');
}

function withSceneDuration(
  panel: StoryboardPanelV1,
  touchpointId: string,
  sceneIndex: number,
  orderedTouchpointIds: readonly string[],
  arc: EpisodeArcV1 | undefined,
): StoryboardPanelV1 {
  return {
    ...panel,
    duration: resolveSceneDurationLabel(touchpointId, sceneIndex, orderedTouchpointIds, arc),
  };
}

/** Structured scenes for markdown describe output or PDF/figma storyboard export. */
export function buildDirectorScriptScenes(input: FormatStoryDirectorNarrativeInput): DirectorScriptSceneV1[] {
  const arc = input.snapshot.when?.storyArc;
  const presentation =
    input.presentation ??
    resolveStoryEpisodePresentation({ journey: input.journey, story: input.story, arc });
  const ids = presentation.scriptTouchpointIds.map((id) => id.trim()).filter(Boolean);
  const scheduleArc =
    presentation.mode === 'session' && arc
      ? { ...arc, touchpointSchedule: [] }
      : arc;
  return ids.map((id, index) => {
    const scene = touchpointScriptScene(input, id, index + 1);
    return {
      ...scene,
      storyboard: withSceneDuration(scene.storyboard, id, index, ids, scheduleArc),
    };
  });
}

function formatScriptScenes(scenes: readonly DirectorScriptSceneV1[], protagonistDescriptor: string): string[] {
  if (scenes.length === 0) {
    return [
      'FADE IN:',
      '',
      '### Scene 1',
      '',
      'INT. UNKNOWN — DAY',
      '',
      '**Storyboard**',
      '- **Visual:** Empty frame; staging TBD',
      '- **Caption:** Scene not mounted yet',
      '- **Setting:** TBD',
      '- **Time:** TBD',
      '- **Duration:** TBD',
      '- **Camera:** Wide 24mm, locked off',
      '- **Shot:** Wide, empty frame',
      '- **Look:** Neutral',
      '- **Props:** None yet',
      '',
      `${protagonistDescriptor} moves through a day we have not staged yet. The role is cast; the scenes will come.`,
    ];
  }

  const lines: string[] = ['FADE IN:', ''];
  scenes.forEach((scene, index) => {
    lines.push(`### Scene ${scene.sceneNumber}`);
    lines.push('');
    lines.push(scene.slugline);
    lines.push('');
    lines.push(...formatStoryboardPanel(scene.storyboard));
    lines.push('');
    lines.push(scene.action);
    if (index < scenes.length - 1) {
      lines.push('');
    }
  });
  lines.push('');
  lines.push('FADE OUT.');
  return lines;
}

function directorTouchpointParagraph(ids: readonly string[]): string {
  const labels = ids.map((id) => humanizeStoryWireLabel(id)).filter(Boolean);
  if (labels.length === 0) {
    return 'I do not have staged touchpoints yet—only the calendar shell. Once beats are mounted, this section becomes the ordered list of what the camera sees.';
  }
  const chain = labels.map((label) => `“${label}”`).join(', then ');
  return `On the surface, the picture plays as ${labels.length} linked beat${labels.length === 1 ? '' : 's'}: ${chain}. Shoot them in that order; each one should feel like a decision, not a menu tap.`;
}

function formatProtagonistLeadSection(
  input: FormatStoryDirectorNarrativeInput,
  scriptScenes: readonly DirectorScriptSceneV1[],
): string[] {
  const ctx = buildStoryboardSceneContext(input);
  const { snapshot } = input;
  const name = ctx.protagonistName;
  const lines: string[] = [
    '## Protagonist',
    '',
    `**${name}**`,
    ctx.protagonistDescriptor !== name ? `_${ctx.protagonistDescriptor}_` : '',
    '',
  ].filter((line) => line.length > 0);

  for (const blurb of buildProtagonistWhoBlurbLines({
    name,
    snapshot,
    character: input.character,
    personaGoals: input.personaGoals,
    personaFrustrations: input.personaFrustrations,
    personaQuote: input.personaQuote,
    storyPitch: ctx.storyPitch,
  })) {
    lines.push(blurb);
  }
  lines.push('');

  const portrait: string[] = [];
  if (ctx.segmentLabel) {
    portrait.push(`She reads as **${ctx.segmentLabel}** on screen`);
  }
  if (ctx.occupation) {
    portrait.push(`works as a **${ctx.occupation}**`);
  }
  if (ctx.traits.length) {
    portrait.push(`comes across as ${ctx.traits.join(', ')}`);
  }
  if (ctx.mindset) {
    portrait.push(`with a **${ctx.mindset}** mindset`);
  }
  if (portrait.length > 0) {
    lines.push(`${portrait.join('; ')}.`);
  } else {
    lines.push(
      `${name} is the human center of this episode—play ordinary detail (phone, bag, doorway) so the audience believes the commute.`,
    );
  }

  lines.push('');
  lines.push(`### What drives ${name}`);
  const motivation: string[] = [];
  if (ctx.storyPitch) {
    motivation.push(ctx.storyPitch);
  }
  const why = snapshot.why;
  if (why?.engagementLevelId) {
    motivation.push(
      `Her engagement with the product sits at **${humanizeToken(why.engagementLevelId)}**—let that tension show in glances, pauses, and thumb-hover beats.`,
    );
  }
  if (why?.focusAreaId) {
    motivation.push(`She is focused on **${humanizeToken(why.focusAreaId)}** this episode.`);
  }
  if (why?.intentIds?.length) {
    motivation.push(
      `Underlying intents: ${why.intentIds.map((id) => humanizeStoryWireLabel(id)).join(', ')}.`,
    );
  }
  if (ctx.mindset && !motivation.some((line) => line.includes(ctx.mindset!))) {
    motivation.push(`Play the **${ctx.mindset}** mindset in how fast she moves and how much she double-checks the map.`);
  }
  if (ctx.wants) {
    motivation.push(`She wants: **${ctx.wants}**.`);
  }
  if (ctx.fears) {
    motivation.push(`She fears: **${ctx.fears}**.`);
  }
  if (ctx.flaw) {
    motivation.push(`Her flaw: **${ctx.flaw}**.`);
  }
  const situationsNarrative =
    input.situationsNarrative ??
    buildStorySituationsNarrativeContext({
      context: input.context,
      journey: input.journey,
      character: input.character,
      personaGoals: input.personaGoals,
      personaFrustrations: input.personaFrustrations,
      personaQuote: input.personaQuote,
    });
  if (situationsNarrative.contextPackContext) {
    motivation.push(
      `**Context:** ${situationsNarrative.contextPackContext}`,
    );
  }
  if (situationsNarrative.journeyGoal) {
    motivation.push(`**Journey goal:** ${situationsNarrative.journeyGoal}`);
  }
  for (const job of situationsNarrative.rankedJobs.slice(0, 3)) {
    motivation.push(formatSituationsJobBullet(job));
  }
  if (input.personaQuote) {
    motivation.push(`In her own words: “${input.personaQuote}”`);
  }
  if (motivation.length === 0) {
    motivation.push(
      'She needs the trip to feel reliable before she commits—every beat is a small bet that the app and the city will cooperate.',
    );
  }
  lines.push(motivation.join('\n\n'));

  const rhythm = input.character?.dailyRhythm;
  if (rhythm?.weekday?.length) {
    lines.push('');
    lines.push('### Typical weekday rhythm');
    const wake = findDailyRhythmBlock(rhythm, 'wake');
    const work = findDailyRhythmBlock(rhythm, 'work');
    const sleep = findDailyRhythmBlock(rhythm, 'sleep');
    const rhythmBits: string[] = [];
    if (wake) {
      rhythmBits.push(`up around **${formatDailyRhythmClock(wake)}**`);
    }
    if (work) {
      rhythmBits.push(
        `${work.setting === 'work' ? 'work' : work.label.toLowerCase()} from **${formatDailyRhythmClock(work)}**`,
      );
    }
    if (sleep) {
      rhythmBits.push(`winds down toward **${formatDailyRhythmClock(sleep)}**`);
    }
    lines.push(
      `${name}’s sampled week: ${rhythmBits.join('; ')}. Scene 1 should feel like that clock—not a generic “morning” placeholder.`,
    );
  }

  lines.push('');
  lines.push(`### Where we find ${name} (before Scene 1)`);
  const whereBits: string[] = [];
  if (ctx.geography) {
    whereBits.push(`We are in **${ctx.geography}** for this episode.`);
  }
  if (ctx.placeLabel) {
    whereBits.push(`Her home base reads as **${ctx.placeLabel}**.`);
  }
  const first = scriptScenes[0];
  const firstTouchpointId = snapshot.when?.storyArc?.objectiveTouchpointIds?.[0]?.trim();
  if (first && firstTouchpointId) {
    const openSam = findStorySceneForTouchpoint(ctx.story, firstTouchpointId);
    const openPlace = resolveScenePlaceForReader({
      touchpointId: firstTouchpointId,
      story: ctx.story,
      samScene: openSam,
      journey: input.journey,
      slugline: first.slugline,
    });
    whereBits.push(`We meet her **${openPlace}** (${first.storyboard.time}).`);
  } else if (first?.slugline) {
    whereBits.push(`The camera meets her at **${first.slugline}** (${first.storyboard.time}).`);
  }
  const openSam =
    (firstTouchpointId ? findStorySceneForTouchpoint(ctx.story, firstTouchpointId) : undefined) ??
    ctx.story?.scenes?.[0];
  if (openSam?.context?.trim()) {
    whereBits.push(openSam.context.trim());
  }
  if (whereBits.length === 0) {
    whereBits.push('Establish a lived-in urban home before the first app beat—morning light, transit noise bleeding through the walls.');
  }
  lines.push(whereBits.join(' '));

  lines.push('');
  return lines;
}

function directorCastParagraph(input: FormatStoryDirectorNarrativeInput): string | undefined {
  const ctx = buildStoryboardSceneContext(input);
  const parts: string[] = [];
  if (ctx.segmentLabel) parts.push(`segment **${ctx.segmentLabel}**`);
  if (ctx.occupation) parts.push(ctx.occupation);
  if (ctx.traits.length) parts.push(`traits: ${ctx.traits.join(', ')}`);
  if (ctx.mindset) parts.push(`mindset “${ctx.mindset}”`);
  if (parts.length === 0) return undefined;
  return `Casting note for **${ctx.protagonistDescriptor}** — ${parts.join('; ')}. Play the psychology in props and pace, not exposition.`;
}

function directorWhereParagraph(snapshot: StoryBriefSnapshotV1): string | undefined {
  const where = snapshot.where;
  if (!where) return undefined;
  const place =
    where.placeSlug?.trim() ||
    where.storeSlug?.trim() ||
    where.zip?.trim() ||
    where.dma?.trim() ||
    where.h3Cell?.trim();
  if (place) {
    return `Geography matters: we anchor the story around ${humanizeToken(place)}. Keep establishing shots honest—audience should recognize the map.`;
  }
  if (typeof where.lat === 'number' && typeof where.lon === 'number') {
    return `We pinned the story to map coordinates (${where.lat}, ${where.lon}). Wide shots should sell “this is a real corner of the world.”`;
  }
  return undefined;
}

function directorWhyParagraph(snapshot: StoryBriefSnapshotV1): string | undefined {
  const why = snapshot.why;
  if (!why) return undefined;
  const parts: string[] = [];
  if (why.engagementLevelId) {
    parts.push(`engagement is “${humanizeToken(why.engagementLevelId)}”`);
  }
  if (why.focusAreaId) {
    parts.push(`focus stays on ${humanizeToken(why.focusAreaId)}`);
  }
  if (why.intentIds?.length) {
    parts.push(`intents include ${why.intentIds.map((id) => humanizeStoryWireLabel(id)).join(', ')}`);
  }
  if (parts.length === 0) return undefined;
  return `Subtext for the cast: ${parts.join('; ')}. Play the want, not the wire label.`;
}

/**
 * Movie-script staging plus a director’s plot explanation — deterministic, no LLM.
 */
export function formatStoryDirectorNarrative(input: FormatStoryDirectorNarrativeInput): string {
  const { snapshot } = input;
  const ctx = buildStoryboardSceneContext(input);
  const title = resolveEpisodeTitle(input);
  const arc = snapshot.when?.storyArc;
  const touchpoints = arc?.objectiveTouchpointIds ?? [];
  const startLabel = formatCalendarDate(snapshot.when?.simulationEpochStart ?? arc?.simulationEpochStart);
  const scriptScenes = buildDirectorScriptScenes(input);
  const situationsNarrative =
    input.situationsNarrative ??
    buildStorySituationsNarrativeContext({
      context: input.context,
      journey: input.journey,
      character: input.character,
      personaGoals: input.personaGoals,
      personaFrustrations: input.personaFrustrations,
      personaQuote: input.personaQuote,
    });
  const episodeTiming = resolveEffectiveEpisodeTiming({
    journey: input.journey,
    story: input.story,
    arc,
    rankedJobCount: situationsNarrative.rankedJobs.length,
  });
  const jobPursuit = formatJobPursuitPhrase({ journey: input.journey, situationsNarrative });
  const lastTouchpointLabel =
    touchpoints.length > 0
      ? humanizeStoryWireLabel(touchpoints[touchpoints.length - 1])
      : undefined;

  const lines: string[] = [
    `# ${title}`,
    '',
    `*Starring ${ctx.protagonistDescriptor}*`,
    '',
    ...formatProtagonistLeadSection(input, scriptScenes),
    ...formatStoryReaderSynopsisLines(input, scriptScenes),
    '## Script',
    '',
    ...formatScriptScenes(scriptScenes, ctx.protagonistDescriptor),
    '',
    '## Director’s commentary',
    '',
    `I'm treating this episode as **${title}**. ${ctx.protagonistDescriptor} is the lens; every shot returns to what they want from this trip.`,
  ];

  if (snapshot.storyPitch?.trim()) {
    lines.push('');
    lines.push(`**Logline:** ${snapshot.storyPitch.trim()}`);
  }

  const castLine = directorCastParagraph(input);
  if (castLine) {
    lines.push('');
    lines.push(castLine);
  }

  lines.push('');
  if (arc || input.journey) {
    lines.push(
      formatDirectorArcParagraph({
        timing: episodeTiming,
        startLabel,
        arc,
        jobPursuit,
        lastTouchpointLabel,
      }),
    );
  } else if (startLabel) {
    lines.push(`We start the clock on ${startLabel}. The episode length is still settling.`);
  }

  const denouementLine = formatDirectorDenouementClosing({
    timing: episodeTiming,
    lastTouchpointLabel,
  });
  if (denouementLine) {
    lines.push('');
    lines.push(denouementLine);
  }

  lines.push('');
  lines.push(directorTouchpointParagraph(touchpoints));

  if (touchpoints.length > 0) {
    const totalScreenSeconds = touchpoints.reduce((sum, id) => sum + defaultScreenSeconds(id), 0);
    const minutes = Math.floor(totalScreenSeconds / 60);
    const seconds = totalScreenSeconds % 60;
    const runtime = minutes > 0 ? `~${minutes} min ${seconds} sec` : `~${seconds} sec`;
    lines.push('');
    lines.push(
      `Cut together, the on-screen spine is about **${runtime}** across ${touchpoints.length} boards (excluding titles and director VO).`,
    );
  }

  const whereLine = directorWhereParagraph(snapshot);
  if (whereLine) {
    lines.push('');
    lines.push(whereLine);
  }

  const whyLine = directorWhyParagraph(snapshot);
  if (whyLine) {
    lines.push('');
    lines.push(whyLine);
  }

  lines.push('');
  lines.push(
    '**Note to production:** IDs and metadata are left out; this read-through is for humans on set.',
  );

  return lines.join('\n').trimEnd();
}
