import type { TwinfileSummaryBase, TwinfileUseMode } from '../types/twinfile-summary.js';
import { TWINFILE_SUMMARY_LAYOUT_ID, TWINFILE_USE_MODE_TITLES } from '../types/twinfile-spec.js';
import { twinfileManifestKindLabel, twinfileRefLabel } from '../twinfile/display-name.js';

function aspectLines(rows: TwinfileSummaryBase['fixed']): string[] {
  return rows.map((row) => `- **${row.label}:** ${String(row.value)}`);
}

function ioLines(rows: TwinfileSummaryBase['io']['inputs']): string[] {
  return rows.map((row) => {
    const tail = row.detail ? ` — ${row.detail}` : '';
    return `- \`${row.id}\`${row.kind ? ` (${row.kind})` : ''}: ${row.label}${tail}`;
  });
}

function modeLines(card: TwinfileSummaryBase, mode: TwinfileUseMode): string[] {
  const fixed = card.fixed;
  const variables = card.variables;
  const inputs = card.io.inputs;
  const outputs = card.io.outputs;
  const lines: string[] = ['', `## ${TWINFILE_USE_MODE_TITLES[mode]}`];
  if (fixed.length > 0) lines.push('', '### Fixed', '', ...aspectLines(fixed));
  if (variables.length > 0) lines.push('', '### Variables', '', ...aspectLines(variables));
  if (inputs.length > 0 || outputs.length > 0) {
    lines.push('', '### Inputs', '', ...(inputs.length > 0 ? ioLines(inputs) : ['- _(none)_']));
    lines.push('', '### Outputs', '', ...(outputs.length > 0 ? ioLines(outputs) : ['- _(none)_']));
  }
  if (lines.length === 2) lines.push('', '_Nothing declared._');
  return lines;
}

/** Markdown summary view derived from {@link TwinfileSummaryBase} (see `renderTwinfileSummaryView`). */
export function formatTwinfileSummaryMarkdown(
  summary: TwinfileSummaryBase | import('../types/twinfile-summary.js').TwinfileSummaryV1,
): string {
  const card = summary;
  const lines: string[] = [
    `# ${card.header.name}`,
    '',
    [
      ...(card.header.subtitle ? [`_${card.header.subtitle}_`] : []),
      twinfileManifestKindLabel(card.head.kind),
      twinfileRefLabel(card.head.id, card.head.version),
    ].join(' · '),
  ];
  if (card.digest) {
    lines.push('', `Digest: \`${card.digest.slice(0, 12)}…\``);
  }
  lines.push(...modeLines(card, TWINFILE_SUMMARY_LAYOUT_ID));
  return lines.join('\n');
}