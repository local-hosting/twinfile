import { compactHostIo } from '../place/compact-host-io.js';
import type {
  TwinfileSummaryAspect,
  TwinfileSummaryBase,
  TwinfileSummaryBlock,
  TwinfileSummaryLayoutV1,
  TwinfileSummaryV1,
} from '@local-hosting/twinfile';
import { twinfileRefLabel } from '@local-hosting/twinfile';
import { TWINFILE_USE_MODE_TITLES } from '@local-hosting/twinfile';

type StatItem = { id: string; label: string; value: string | number };
type ModeRows = Pick<TwinfileSummaryV1, 'fixed' | 'variables' | 'io'>;

function allRows(card: TwinfileSummaryBase): ModeRows {
  return {
    fixed: card.fixed,
    variables: card.variables,
    io: { inputs: card.io.inputs, outputs: card.io.outputs },
  };
}

function statItems(rows: ModeRows): StatItem[] {
  const pick = rows.variables.filter(
    (row) =>
      typeof row.value === 'number' ||
      row.id.endsWith('.count') ||
      row.id.startsWith('capacity.'),
  );
  return pick.map((row) => ({
    id: row.id,
    label: row.label.replace(/ \(sum\)$/, ''),
    value: typeof row.value === 'boolean' ? (row.value ? 1 : 0) : row.value,
  }));
}

function aspectRows(rows: TwinfileSummaryV1['fixed'] | TwinfileSummaryV1['variables']) {
  return rows.map((row) => ({
    id: row.id,
    label: row.label,
    value: row.value,
  }));
}

function portRows(ports: TwinfileSummaryV1['io']['inputs']) {
  return ports.map((row) => ({
    id: row.id,
    label: row.label,
    kind: row.kind,
    hint: row.detail,
  }));
}

function heroBlock(card: TwinfileSummaryBase, options?: { chips?: string[] }): TwinfileSummaryBlock {
  const defaultChips = [
    card.head.kind,
    twinfileRefLabel(card.head.id, card.head.version),
    ...(card.head.stability ? [card.head.stability] : []),
  ];
  return {
    type: 'hero',
    icon: card.header.icon,
    title: card.header.name,
    ...(card.header.subtitle ? { subtitle: card.header.subtitle } : {}),
    chips: options?.chips ?? defaultChips,
  };
}

function ioBlock(card: TwinfileSummaryBase): TwinfileSummaryBlock {
  const hostIo = compactHostIo(card.io);
  return {
    type: 'io',
    inputs: portRows(hostIo.inputs),
    outputs: portRows(hostIo.outputs),
  };
}

function fixedRowsForDisplay(card: TwinfileSummaryBase, fixed: TwinfileSummaryAspect[]): TwinfileSummaryAspect[] {
  return fixed.filter((row) => row.id !== 'geotype.kind' || !card.header.subtitle);
}

function bodyBlocks(card: TwinfileSummaryBase, rows: ModeRows): TwinfileSummaryBlock[] {
  const blocks: TwinfileSummaryBlock[] = [];
  const stats = statItems(rows);

  if (card.regions?.length) {
    const rollupStats = stats.filter((row) => row.id !== 'spaces.count');
    if (rollupStats.length > 0) {
      blocks.push({ type: 'stats', title: 'Site', items: rollupStats });
    }
    blocks.push({
      type: 'list',
      title: 'regions',
      rows: card.regions.map((row) => ({
        id: row.id,
        label: row.name ?? row.id,
        value: row.id,
      })),
    });
  } else if (stats.length > 0) {
    blocks.push({ type: 'stats', title: 'Site', items: stats });
  }

  const siteFixed = fixedRowsForDisplay(card, rows.fixed);
  if (siteFixed.length > 0) {
    blocks.push({ type: 'list', title: 'Compose', rows: aspectRows(siteFixed) });
  }

  const otherVars = rows.variables.filter(
    (row) =>
      !stats.some((s) => s.id === row.id) &&
      typeof row.value !== 'boolean',
  );
  if (otherVars.length > 0) {
    blocks.push({ type: 'list', title: 'Run', rows: aspectRows(otherVars) });
  }

  const hostIo = compactHostIo(rows.io);
  if (hostIo.inputs.length > 0 || hostIo.outputs.length > 0) {
    blocks.push({
      type: 'io',
      inputs: portRows(hostIo.inputs),
      outputs: portRows(hostIo.outputs),
    });
  }
  return blocks;
}

function buildPlaceLayout(card: TwinfileSummaryBase): TwinfileSummaryLayoutV1 {
  const rows = allRows(card);
  const blocks: TwinfileSummaryBlock[] =
    card.head.kind === 'place'
      ? [heroBlock(card, { chips: [] }), ioBlock(card)]
      : [heroBlock(card), ...bodyBlocks(card, rows)];
  return {
    schema: 'twinfile.summary.layout.v1',
    mode: 'place',
    title: TWINFILE_USE_MODE_TITLES.place,
    blocks,
  };
}

export function buildTwinfileSummaryLayouts(card: TwinfileSummaryBase): TwinfileSummaryV1['layouts'] {
  return { place: buildPlaceLayout(card) };
}

export function finishTwinfileSummary(base: TwinfileSummaryBase): TwinfileSummaryV1 {
  return { ...base, layouts: buildTwinfileSummaryLayouts(base) };
}

