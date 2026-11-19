import type { TwinfileAuditCardV1 } from './types.js';

export function formatTwinfileAuditBrief(card: TwinfileAuditCardV1): string {
  const gaps = card.findings.filter((f) => f.level === 'gap').length;
  const warns = card.findings.filter((f) => f.level === 'warn').length;
  const suffix = gaps === 0 && warns === 0 ? 'ok' : `gap:${gaps}${warns > 0 ? ` warn:${warns}` : ''}`;
  return `${card.header.id}\t${suffix}`;
}