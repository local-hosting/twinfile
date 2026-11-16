import type { Journey, Character } from '@doppler-group/twinfile-character/persona';
import type { JobSituationModel } from '@doppler-group/twinfile-context';
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
  /** Org Situations model(s) merged for JTBD lookups. */
  situations?: JobSituationModel;
  personaGoals?: readonly string[];
  personaFrustrations?: readonly string[];
  personaQuote?: string;
  /** Org Character persona label when instance wire used a technical displayName. */
  personaLabel?: string;
  /** Org Character document for exemplar / label fallbacks (optional). */
  focalCharacter?: Character;
  /** Precomputed; otherwise derived from journey + arc. */
  presentation?: StoryEpisodePresentationV1;
  /** Precomputed Situations + persona context. */
  situationsNarrative?: StorySituationsNarrativeContextV1;
};
