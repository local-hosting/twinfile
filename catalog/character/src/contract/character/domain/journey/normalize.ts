import type { JourneyEmotionBand, JourneyEmotions, JourneyPhase } from '../../types/story/journey.js';

type PhaseWithLegacyEmotion = JourneyPhase & { emotion?: JourneyEmotionBand };

export function coalesceJourneyEmotions(
  emotions: JourneyEmotions | undefined,
  legacyBand: JourneyEmotionBand | undefined,
): JourneyEmotions {
  if (emotions && (emotions.band ?? emotions.feelings?.length ?? emotions.valence ?? emotions.curve !== undefined)) {
    return {
      ...emotions,
      band: emotions.band ?? legacyBand ?? 'mid',
    };
  }
  return { band: legacyBand ?? 'mid' };
}

export function normalizeJourneyPhase(phase: PhaseWithLegacyEmotion): JourneyPhase {
  const { emotion, ...rest } = phase;
  return {
    ...rest,
    emotions: coalesceJourneyEmotions(rest.emotions, emotion),
  };
}
