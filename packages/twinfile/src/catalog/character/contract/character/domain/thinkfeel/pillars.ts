/** THINK · FEEL · SAY · DO — situational voice pillars (not skyline need boxes). */
export const THINKFEEL_PILLARS = ['think', 'feel', 'say', 'do'] as const;

export type ThinkFeelPillar = (typeof THINKFEEL_PILLARS)[number];

export const THINKFEEL_PILLAR_LABELS: Record<ThinkFeelPillar, string> = {
  think: 'Thinks',
  feel: 'Feels',
  say: 'Says',
  do: 'Does',
};
