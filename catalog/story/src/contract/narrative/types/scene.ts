import type { DramaticBeatId } from './dramatic-beat.js';

export type SceneEmotionBand = 'low' | 'mid' | 'high';

export type SceneEmotionValence = 'negative' | 'neutral' | 'positive';

/** Scene-level emotion — aligns with PCM {@link JourneyEmotions} on journey phases/moments. */
export type SceneEmotions = {
  band?: SceneEmotionBand;
  valence?: SceneEmotionValence;
  feelings?: string[];
  /** Narrative tension sample −1…1 for curve / storyboard rail. */
  curve?: number;
};

export type StorySceneTouchpointRef = {
  id: string;
  placeRef?: string;
  spaceId?: string;
};

/** JTBD + feelings for one cast member when several characters share a scene. */
export type SceneCharacterBeat = {
  pcmId: string;
  jobIds?: string[];
  emotions?: SceneEmotions;
  pain?: string;
  gain?: string;
};

/**
 * One storyboard frame — cast at a place, with optional touchpoints and PCM journey links.
 * Authoritative runtime story spine when `scenes` is present on {@link import('./sam.js').SAM}.
 */
export type StoryScene = {
  id: string;
  label: string;
  order: number;
  /** Dramatic beat on the arc rail (`actId` alias in YAML). */
  actId: DramaticBeatId;
  narrativeBeat?: string;
  situation?: string;
  /** PCM ids present in this scene — subset of {@link import('./sam.js').SAM.characters}. */
  characterIds: string[];
  /** Mounted place place key — must appear on {@link import('./sam.js').SAM.places}. */
  placeRef: string;
  /** Primary `space:*` on the mounted place — defaults from place mount when omitted. */
  spaceId?: string;
  /** Optional `moments:*` beat on the mounted place visit arc. */
  visitMomentId?: string;
  /**
   * Touchpoints in this frame — use `placeRef` / `spaceId` on each row when the org graph
   * marks the touchpoint `physical` or `blended` and it differs from the scene default.
   */
  touchpoints?: StorySceneTouchpointRef[];
  /** Shorthand when every touchpoint shares the scene `placeRef`. */
  touchpointIds?: string[];
  /** Optional link back to authored PCM/AXM journey rows during migration. */
  journeyPhaseId?: string;
  journeyMomentId?: string;
  /** JTBD job ids in play for the focal beat. */
  jobIds?: string[];
  /** Default emotions for the scene — use {@link cast} when characters diverge. */
  emotions?: SceneEmotions;
  pain?: string;
  gain?: string;
  cast?: SceneCharacterBeat[];
};
