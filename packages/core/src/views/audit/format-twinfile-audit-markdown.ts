import type { TwinfileAuditCardV1, TwinfileAuditLensRowV1 } from './types.js';

function lensSection(title: string, rows: TwinfileAuditLensRowV1[]): string[] {
  const lines: string[] = ['', `## ${title}`];
  if (rows.length === 0) {
    lines.push('', '_None._');
    return lines;
  }
  for (const row of rows) {
    const tail = row.detail ? ` — ${row.detail}` : '';
    lines.push(`- **${row.label}** (\`${row.id}\`)${tail}`);
  }
  return lines;
}

/** LLM-oriented markdown believability card. */
export function formatTwinfileAuditMarkdown(card: TwinfileAuditCardV1): string {
  const meta = [
    card.header.kind,
    `v${card.header.version || '0'}`,
    card.header.stability,
  ]
    .filter(Boolean)
    .join(' · ');

  const lines: string[] = [
    `# Audit: ${card.header.name}`,
    '',
    `Unit \`${card.header.id}\` · ${meta}`,
    '',
    '_Deterministic structural audit for believability review — not schema validation (`twin check`)._',
    ...lensSection('Cast', card.lenses.cast),
    ...lensSection('Stage', card.lenses.stage),
    ...lensSection('Motive', card.lenses.motive),
    ...lensSection('Path', card.lenses.path),
    ...lensSection('Props', card.lenses.props),
    ...lensSection('Bless', card.lenses.bless),
    '',
    '## Findings',
  ];

  if (card.findings.length === 0) {
    lines.push('', '_No findings._');
  } else {
    for (const finding of card.findings) {
      lines.push(`- **${finding.level}** \`${finding.code}\` — ${finding.message}`);
    }
  }

  if (card.linked.length > 0) {
    lines.push('', '## Linked units');
    for (const link of card.linked) {
      const status = link.resolved
        ? `${link.kind ?? '?'} / ${link.id ?? '?'}${
            link.anchor ? ` @ ${link.anchor}` : ''
          }`
        : 'unresolved';
      lines.push(`- \`${link.rel}\` → ${link.href} (${status})`);
    }
  }

  return lines.join('\n').trimEnd();
}