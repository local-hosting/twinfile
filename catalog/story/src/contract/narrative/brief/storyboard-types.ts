import type { Journey, PCM } from '@local-hosting/twinfile-character/pcm';
import type { JobSituationModel } from '@local-hosting/twinfile-character/jsm';
import type { SAM } from '../types/sam.js';
import type { StoryEpisodePresentationV1 } from './resolve-story-episode-presentation.js';
import type { StoryJsmNarrativeContextV1 } from './story-jsm-narrative-context.js';
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
  sam?: SAM;
  /** PCM user journey for `sam.binding.journeyId`. */
  journey?: Journey;
  /** Org JSM model(s) merged for JTBD lookups. */
  jsm?: JobSituationModel;
  personaGoals?: readonly string[];
  personaFrustrations?: readonly string[];
  personaQuote?: string;
  /** Org PCM persona label when instance wire used a technical displayName. */
  personaLabel?: string;
  /** Org PCM document for exemplar / label fallbacks (optional). */
  focalPcm?: PCM;
  /** Precomputed; otherwise derived from journey + arc. */
  presentation?: StoryEpisodePresentationV1;
  /** Precomputed JSM + persona context. */
  jsmNarrative?: StoryJsmNarrativeContextV1;
};
