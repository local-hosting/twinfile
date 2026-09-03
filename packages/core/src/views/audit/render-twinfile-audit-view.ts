import { formatTwinfileAuditMarkdown } from './format-twinfile-audit-markdown.js';
import type { TwinfileAuditCardV1, TwinfileAuditViewFormat } from './types.js';

export function renderTwinfileAuditView(
  card: TwinfileAuditCardV1,
  format: TwinfileAuditViewFormat,
): string {
  if (format === 'json') {
    return JSON.stringify(card, null, 2);
  }
  return formatTwinfileAuditMarkdown(card);
}