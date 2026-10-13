import { formatBuildLayerStepLabel } from './build-layer-label.js';

export type BuildLayerRowLike = {
  index: number;
  ref: string;
  kind: string;
  chain: string;
  label?: string;
  imageLayerCount?: number;
  detail?: BuildLayerRowLike[];
};

export function buildLayerDisplayLabel(row: BuildLayerRowLike): string {
  if (row.label) return row.label;
  const base = formatBuildLayerStepLabel(row.ref);
  if (row.imageLayerCount && row.imageLayerCount > 1) {
    return `${base} (${row.imageLayerCount} image layers)`;
  }
  return base;
}

function copyGroupPrefix(ref: string): string | undefined {
  const nested = ref.match(/^copy\/([^/]+)\/patch\//);
  return nested?.[1];
}

/** Collapse expanded `copy:` imports for workbench / CLI (digest chain unchanged on disk). */
export function summarizeBuildLayerRows<T extends BuildLayerRowLike>(rows: T[]): T[] {
  const out: T[] = [];
  let i = 0;
  while (i < rows.length) {
    const layer = rows[i]!;
    const group = copyGroupPrefix(layer.ref);
    if (!group) {
      out.push(layer);
      i += 1;
      continue;
    }
    const detail: T[] = [layer];
    let j = i + 1;
    while (j < rows.length) {
      const next = rows[j]!;
      if (copyGroupPrefix(next.ref) !== group) break;
      detail.push(next);
      j += 1;
    }
    if (detail.length === 1) {
      out.push(layer);
    } else {
      const summary = {
        ...layer,
        ref: `copy/${group}`,
        kind: 'copy',
        chain: detail[detail.length - 1]!.chain,
        imageLayerCount: detail.length,
        detail,
      } as T;
      out.push(summary);
    }
    i = j;
  }
  return out;
}
