import { findDailyRhythmBlock, formatDailyRhythmClock } from './persona-daily-rhythm-format.js';
import type { Story } from '../types/story-narrative.js';
import type { StoryScene } from '../types/scene.js';
import { findJourneyTouchpointBinding } from './journey-touchpoint-binding.js';
import { resolveJobsForTouchpoint } from './story-situations-narrative-context.js';
import type { StoryBriefCharacterV1, StoryBriefSnapshotV1 } from './types.js';
import type { DirectorScriptSceneV1, FormatStoryDirectorNarrativeInput, StoryboardPanelV1 } from './storyboard-types.js';
import {
  isTechnicalStoryIdentityLabel,
  resolveHumanProtagonistNameWithCharacter,
} from './protagonist-identity.js';
import { resolvePlaceLabelForNarrative } from './resolve-scene-place-for-reader.js';

export function humanizeToken(token: string): string {
  const trimmed = token.trim();
  if (!trimmed) return '';
  return trimmed
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

/** Turn `touchpoint:rider-open-home` into readable phrase text. */
export function humanizeStoryWireLabel(raw: string | undefined): string {
  const id = raw?.trim();
  if (!id) return '';
  let leaf = id.includes(':') ? id.split(':').pop() ?? id : id;
  leaf = leaf.replace(/^(rider|driver|guest|shopper)-/i, '');
  return humanizeToken(leaf);
}

export type StoryboardSceneContextV1 = {
  protagonistName: string;
  protagonistDescriptor: string;
  geography?: string;
  placeLabel?: string;
  segmentLabel?: string;
  mindset?: string;
  traits: readonly string[];
  wants?: string;
  fears?: string;
  flaw?: string;
  occupation?: string;
  engagementLevel?: string;
  focusArea?: string;
  storyPitch?: string;
  story?: Story;
};

function resolveProtagonistName(input: FormatStoryDirectorNarrativeInput): string {
  const focalCharacter = input.focalCharacter;
  const personaLabel = input.personaLabel;
  if (focalCharacter || personaLabel) {
    return resolveHumanProtagonistNameWithCharacter({
      snapshot: input.snapshot,
      character: input.character,
      focalCharacter,
      personaLabel,
    });
  }
  const { snapshot, character } = input;
  const fromCharacter = character?.name?.trim();
  if (fromCharacter && !isTechnicalStoryIdentityLabel(fromCharacter)) return fromCharacter;
  const fromWho = snapshot.who?.displayName?.trim();
  if (fromWho && !isTechnicalStoryIdentityLabel(fromWho)) return fromWho;
  const personaId = snapshot.personaId?.trim() || character?.personaId?.trim();
  if (personaId && !isTechnicalStoryIdentityLabel(personaId)) {
    return humanizeStoryWireLabel(personaId) || personaId;
  }
  const storyId = snapshot.storyId?.trim();
  if (storyId) {
    return humanizeToken(storyId) || 'Our protagonist';
  }
  return 'Our protagonist';
}

function resolveProtagonistDescriptor(input: FormatStoryDirectorNarrativeInput, name: string): string {
  const { snapshot, character } = input;
  const age = character?.age;
  const occupation = character?.occupation?.trim();
  const segment =
    character?.psychology?.segmentLabel?.trim() ||
    humanizeStoryWireLabel(character?.psychology?.segmentId) ||
    humanizeStoryWireLabel(snapshot.who?.segmentId);
  const role = occupation || segment;
  if (age != null && role) return `${name}, ${age}, ${role}`;
  if (age != null) return `${name}, ${age}`;
  if (role) return `${name}, ${role}`;
  return name;
}

function resolveStoryGeography(snapshot: StoryBriefSnapshotV1): string | undefined {
  const where = snapshot.where;
  if (!where) return undefined;
  const place =
    where.placeSlug?.trim() ||
    where.storeSlug?.trim() ||
    where.zip?.trim() ||
    where.h3Cell?.trim();
  const region = where.dma?.trim();
  if (place && region) return `${humanizeToken(place)}, ${region}`;
  if (place) return humanizeToken(place);
  if (region) return region;
  return undefined;
}

function resolvePlaceLabelFromSam(story: Story | undefined, placeRef: string | undefined): string | undefined {
  const id = placeRef?.trim();
  if (!id) return undefined;
  const place = story?.places?.find((row) => row.placeRef?.trim() === id);
  if (place?.label?.trim()) return place.label.trim();
  return humanizeStoryWireLabel(id);
}

export function findStorySceneForTouchpoint(story: Story | undefined, touchpointId: string): StoryScene | undefined {
  const needle = touchpointId.trim();
  if (!needle || !story?.scenes?.length) return undefined;
  for (const scene of story.scenes) {
    if (scene.touchpointIds?.some((id) => id.trim() === needle)) return scene;
    if (scene.touchpoints?.some((row) => row.id.trim() === needle)) return scene;
  }
  return undefined;
}

export function buildStoryboardSceneContext(input: FormatStoryDirectorNarrativeInput): StoryboardSceneContextV1 {
  const { snapshot, character, story } = input;
  const protagonistName = resolveProtagonistName(input);
  const firstScene = story?.scenes?.[0];
  const placeFromSam = firstScene ? resolvePlaceLabelFromSam(story, firstScene.placeRef) : undefined;

  return {
    protagonistName,
    protagonistDescriptor: resolveProtagonistDescriptor(input, protagonistName),
    geography: resolveStoryGeography(snapshot),
    placeLabel: placeFromSam,
    segmentLabel:
      character?.psychology?.segmentLabel?.trim() ||
      humanizeStoryWireLabel(character?.psychology?.segmentId) ||
      humanizeStoryWireLabel(snapshot.who?.segmentId),
    mindset: character?.psychology?.mindset?.trim(),
    traits: character?.psychology?.traits?.map((t) => t.trim()).filter(Boolean) ?? [],
    wants: character?.psychology?.personality?.wants?.trim(),
    fears: character?.psychology?.personality?.fears?.trim(),
    flaw: character?.psychology?.personality?.flaw?.trim(),
    occupation: character?.occupation?.trim(),
    engagementLevel: snapshot.why?.engagementLevelId?.trim(),
    focusArea: snapshot.why?.focusAreaId?.trim(),
    storyPitch: snapshot.storyPitch?.trim(),
    story,
  };
}

function occupationPropHint(occupation: string): string | undefined {
  const key = occupation.toLowerCase();
  if (key.includes('engineer') || key.includes('developer') || key.includes('designer')) {
    return 'work bag, headphones';
  }
  if (key.includes('nurse') || key.includes('clinical') || key.includes('medic')) {
    return 'comfort shoes, hospital ID';
  }
  if (key.includes('teacher') || key.includes('educator')) {
    return 'tote with papers, reusable coffee cup';
  }
  if (key.includes('driver') || key.includes('courier')) {
    return 'insulated delivery bag, phone mount';
  }
  return undefined;
}

function emotionLookSuffix(scene: StoryScene | undefined): string {
  const valence = scene?.emotions?.valence;
  if (valence === 'negative') return 'Slightly tense grade; shoulders weighted in frame.';
  if (valence === 'positive') return 'Airy highlights; room to breathe in the composition.';
  return '';
}

export function applyStoryboardPersonalization(
  draft: DirectorScriptSceneV1,
  ctx: StoryboardSceneContextV1,
  touchpointId: string,
  input?: FormatStoryDirectorNarrativeInput,
): DirectorScriptSceneV1 {
  const samScene = findStorySceneForTouchpoint(ctx.story, touchpointId);
  const journeyBinding = input?.journey
    ? findJourneyTouchpointBinding(input.journey, touchpointId)
    : undefined;
  const jsmJobs = input
    ? resolveJobsForTouchpoint({
        context: input.context,
        journey: input.journey,
        touchpointId,
        personaJobIds: input.character?.psychology?.characterId ? undefined : undefined,
      })
    : [];
  const place =
    (samScene
      ? resolvePlaceLabelForNarrative({
          story: ctx.story,
          placeRef: samScene.placeRef,
          journey: input?.journey,
          touchpointId,
        })
      : undefined) ||
    ctx.placeLabel ||
    ctx.geography;
  const { protagonistName, protagonistDescriptor } = ctx;

  const sceneContext = samScene?.context?.trim();
  const narrativeBeat = samScene?.narrativeBeat?.trim();
  const sceneLabel = samScene?.label?.trim();

  const phaseContext =
    journeyBinding?.moment?.context?.trim() || journeyBinding?.phase.context?.trim();
  const phasePain = journeyBinding?.phase.pain?.trim();

  let visual = draft.storyboard.visual.replaceAll(protagonistName, protagonistDescriptor);
  if (sceneContext || phaseContext) {
    visual = `${protagonistDescriptor} — ${sceneContext || phaseContext}`;
  } else if (ctx.storyPitch && draft.sceneNumber === 1) {
    visual = `${visual} (${ctx.storyPitch})`;
  }
  if (phasePain && !visual.includes(phasePain)) {
    visual = `${visual} (${phasePain})`;
  }

  const primaryJob = jsmJobs[0];
  let caption =
    narrativeBeat ||
    (primaryJob ? `${primaryJob.goal}` : undefined) ||
    (sceneLabel ? `${sceneLabel}.` : undefined) ||
    draft.storyboard.caption;
  if (ctx.mindset && !narrativeBeat && !primaryJob) {
    caption = `${caption.replace(/\.$/, '')} — ${ctx.mindset}.`;
  }

  let action = draft.action.replaceAll(protagonistName, protagonistDescriptor);
  if (sceneContext) {
    action = `${protagonistDescriptor}: ${sceneContext}`;
  }

  let setting = draft.storyboard.setting;
  if (place) {
    setting = setting.includes(place) ? setting : `${place}; ${setting}`;
  }

  let look = draft.storyboard.look;
  const emotionLook = emotionLookSuffix(samScene);
  if (emotionLook && !look.includes(emotionLook)) {
    look = `${look}; ${emotionLook}`;
  }
  if (ctx.traits.length > 0) {
    look = `${look}; personality read: ${ctx.traits.slice(0, 3).join(', ')}`;
  }

  const propParts = [draft.storyboard.props];
  if (ctx.occupation) {
    const hint = occupationPropHint(ctx.occupation);
    propParts.push(hint ?? `${ctx.occupation} essentials`);
  }
  if (samScene?.jobIds?.length) {
    propParts.push(`jobs in play: ${samScene.jobIds.map((id) => humanizeStoryWireLabel(id)).join(', ')}`);
  }
  if (jsmJobs.length) {
    propParts.push(`need: ${jsmJobs.map((job) => job.label).join(', ')}`);
  }

  let time = draft.storyboard.time;
  const rhythm = input?.character?.dailyRhythm;
  const wake = rhythm ? findDailyRhythmBlock(rhythm, 'wake') : undefined;
  const homeMorning = rhythm ? findDailyRhythmBlock(rhythm, 'home_morning') : undefined;
  if (draft.sceneNumber === 1 && wake) {
    time = `Around ${formatDailyRhythmClock(wake)} — ${homeMorning?.label ?? 'home morning'} (${rhythm?.label ?? 'weekday rhythm'})`;
  }

  const storyboard: StoryboardPanelV1 = {
    ...draft.storyboard,
    visual,
    caption,
    setting,
    time,
    look,
    props: propParts.filter(Boolean).join('; '),
  };

  return { ...draft, action, storyboard };
}

export function serializeStoryboardLlmContext(input: FormatStoryDirectorNarrativeInput): string {
  const ctx = buildStoryboardSceneContext(input);
  return JSON.stringify(
    {
      protagonist: {
        name: ctx.protagonistName,
        descriptor: ctx.protagonistDescriptor,
        occupation: ctx.occupation,
        segment: ctx.segmentLabel,
        mindset: ctx.mindset,
        traits: ctx.traits,
        wants: ctx.wants,
        fears: ctx.fears,
        flaw: ctx.flaw,
      },
      place: { geography: ctx.geography, place: ctx.placeLabel },
      story: {
        pitch: ctx.storyPitch,
        engagement: ctx.engagementLevel,
        focus: ctx.focusArea,
        storyId: input.snapshot.what?.storyId,
      },
      storyScenes: ctx.story?.scenes?.map((scene) => ({
        id: scene.id,
        label: scene.label,
        context: scene.context,
        narrativeBeat: scene.narrativeBeat,
        placeRef: scene.placeRef,
        touchpointIds: scene.touchpointIds,
      })),
    },
    null,
    2,
  );
}
