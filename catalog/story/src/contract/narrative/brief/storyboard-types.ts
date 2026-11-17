import type { Journey, Character } from '@local-hosting/twinfile-character/persona';
import type { JobContextModel } from '@local-hosting/twinfile-context';
import type { Story } from '../types/story-narrative.js';
import type { StoryEpisodePresentationV1 } from './resolve-story-episode-presentation.js';
import type { StorySituationsNarrativeContextV1 } from './story-situations-narrative-context.js';
import type { StoryBriefCharacterV1, StoryBriefSnapshotV1 } from './types.js';

/** Per-scene production board (deterministic from touchpoint + episode context). */
export type StoryboardPanelV1 = {
  visual: string;
  caption: string;
  setting: string;
  time: string;
  duration: string;
  camera: string;
  shot: string;
  look: string;
  props: string;
};

export type DirectorScriptSceneV1 = {
  sceneNumber: number;
  slugline: string;
  action: string;
  storyboard: StoryboardPanelV1;
};

export type FormatStoryDirectorNarrativeInput = {
  snapshot: StoryBriefSnapshotV1;
  character?: StoryBriefCharacterV1;
  story?: Story;
  /** Character user journey for `story.binding.journeyId`. */
  journey?: Journey;
  /** Context twin (`kind: context`) for JTBD lookups. */
  context?: JobContextModel;
  personaGoals?: readonly string[];
  personaFrustrations?: readonly string[];
  personaQuote?: string;
  /** Org Character persona label when instance wire used a technical displayName. */
  personaLabel?: string;
  /** Org Character document for exemplar / label fallbacks (optional). */
  focalCharacter?: Character;
  /** Precomputed; otherwise derived from journey + arc. */
  presentation?: StoryEpisodePresentationV1;
  /** Precomputed Context + persona JTBD narrative. */
  situationsNarrative?: StorySituationsNarrativeContextV1;
};
