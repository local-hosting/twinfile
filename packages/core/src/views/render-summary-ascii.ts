import type { TwinfileSummaryBlock, TwinfileSummaryLayoutV1, TwinfileSummaryV1 } from '../types/twinfile-summary.js';
import { TWINFILE_SUMMARY_LAYOUT_ID } from '../types/twinfile-spec.js';

const W = 52;

function clip(text: string, max: number): string {
  const t = text.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function padLine(content: string): string {
  const inner = clip(content, W - 2);
  return `│ ${inner.padEnd(W - 2)} │`;
}

function sectionTitle(title: string): string {
  const label = `── ${title.toUpperCase()} `;
  const fill = '─'.repeat(Math.max(0, W - label.length));
  return `├${label}${fill}┤`;
}

function renderHero(block: Extract<TwinfileSummaryBlock, { type: 'hero' }>): string[] {
  return [
    padLine(`${block.icon}  ${block.title}`),
    ...(block.subtitle ? [padLine(block.subtitle)] : []),
    padLine(block.chips.map((c) => `[${c}]`).join(' ')),
  ];
}

function renderStats(block: Extract<TwinfileSummaryBlock, { type: 'stats' }>): string[] {
  const lines: string[] = [sectionTitle(block.title)];
  for (const item of block.items) {
    lines.push(padLine(`${item.label}: ${item.value}`));
  }
  return lines;
}

function renderList(block: Extract<TwinfileSummaryBlock, { type: 'list' }>): string[] {
  const lines: string[] = [sectionTitle(block.title)];
  for (const row of block.rows.slice(0, 8)) {
    const val = row.value !== undefined ? `: ${row.value}` : '';
    lines.push(padLine(`• ${row.label}${val}`));
  }
  if (block.rows.length > 8) {
    lines.push(padLine(`• … +${block.rows.length - 8} more`));
  }
  return lines;
}

function renderPorts(block: Extract<TwinfileSummaryBlock, { type: 'ports' }>): string[] {
  const arrow = block.direction === 'in' ? '→ in' : '← out';
  const lines: string[] = [sectionTitle(`${block.title} ${arrow}`)];
  for (const row of block.rows.slice(0, 6)) {
    const kind = row.kind ? ` (${row.kind})` : '';
    lines.push(padLine(`• ${row.id}${kind}`));
    if (row.hint) lines.push(padLine(`  ${clip(row.hint, W - 4)}`));
  }
  if (block.rows.length > 6) {
    lines.push(padLine(`• … +${block.rows.length - 6} more`));
  }
  return lines;
}

function renderIo(block: Extract<TwinfileSummaryBlock, { type: 'io' }>): string[] {
  const colW = Math.floor((W - 3) / 2);
  const lines: string[] = [sectionTitle('inputs · outputs')];
  lines.push(
    `│ ${'INPUTS'.padEnd(colW)}│ ${'OUTPUTS'.padEnd(colW)} │`,
  );
  const n = Math.max(block.inputs.length, block.outputs.length);
  for (let i = 0; i < Math.min(n, 8); i += 1) {
    const inRow = block.inputs[i];
    const outRow = block.outputs[i];
    const left = inRow ? clip(`• ${inRow.id}`, colW) : '';
    const right = outRow ? clip(`• ${outRow.id}`, colW) : '';
    lines.push(`│ ${left.padEnd(colW)}│ ${right.padEnd(colW)} │`);
  }
  if (n > 8) {
    lines.push(padLine(`… +${n - 8} more rows`));
  }
  return lines;
}

function renderBlock(block: TwinfileSummaryBlock): string[] {
  switch (block.type) {
    case 'hero':
      return renderHero(block);
    case 'stats':
      return renderStats(block);
    case 'list':
      return renderList(block);
    case 'ports':
      return renderPorts(block);
    case 'io':
      return renderIo(block);
    case 'note':
      return [padLine(block.text)];
    default: {
      const _exhaustive: never = block;
      return _exhaustive;
    }
  }
}

function renderLayoutBox(layout: TwinfileSummaryLayoutV1, digest: string | null): string {
  const label = `── ${layout.title.toUpperCase()} `;
  const top = `┌${label}${'─'.repeat(Math.max(0, W - label.length))}┐`;
  const bottom = `└${'─'.repeat(W)}┘`;
  const body = layout.blocks.flatMap(renderBlock);
  if (digest) {
    body.push(sectionTitle('digest'));
    body.push(padLine(digest.slice(0, W - 2)));
  }
  return [top, ...body, bottom].join('\n');
}

/** Terminal-friendly box drawing for the place layout. */
export function renderTwinfileSummaryAscii(summary: TwinfileSummaryV1): string {
  const card = summary;
  const layouts = card.layouts as Record<string, TwinfileSummaryLayoutV1 | undefined>;
  const layout =
    layouts[TWINFILE_SUMMARY_LAYOUT_ID] ?? layouts.place;
  if (!layout) {
    const first = Object.values(layouts).find((l) => l != null && Array.isArray(l.blocks));
    if (!first) return '';
    return renderLayoutBox(first, card.digest);
  }
  return renderLayoutBox(layout, card.digest);
}