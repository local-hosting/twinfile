import type { PersonaEmpathyMap } from '../../types/strategy/persona.js';

import { THINKFEEL_PILLAR_LABELS } from './pillars.js';

/** Markdown section for a persona thinkfeel map (card / deliverable). */
export function formatThinkFeelMapMarkdown(map: PersonaEmpathyMap | undefined): string[] {
  if (!map) return [];
  const row = (label: string, items: string[]) =>
    items.length ? `- **${label}:** ${items.join('; ')}` : '';
  return [
    '',
    '## Think · Feel · Say · Do',
    row(THINKFEEL_PILLAR_LABELS.think, map.think),
    row(`${THINKFEEL_PILLAR_LABELS.feel} (+)`, map.feel.positive),
    row(`${THINKFEEL_PILLAR_LABELS.feel} (−)`, map.feel.negative),
    row(`${THINKFEEL_PILLAR_LABELS.say} (+)`, map.say.positive),
    row(`${THINKFEEL_PILLAR_LABELS.say} (−)`, map.say.negative),
    row(THINKFEEL_PILLAR_LABELS.do, map.do),
  ].filter((line) => line !== '');
}
