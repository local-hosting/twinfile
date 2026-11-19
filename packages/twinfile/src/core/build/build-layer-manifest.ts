import { isPatchesTwinfile } from '../load/twinfile-instructions.js';
import { twinfileStepItems } from '../load/twinfile-compose.js';
import { twinfilePlaceLayerPaths } from '../load/twinfile-paths.js';
import { isRecord } from '../doc/is-record.js';

export type TwinfileManifestBuildStep = {
  stepIndex: number;
  label: string;
};

export type TwinfileManifestRecipe = {
  from?: string;
  steps: TwinfileManifestBuildStep[];
};

function manifestStepLabel(item: unknown, stepIndex: number): string | undefined {
  if (!isRecord(item)) return undefined;
  if (typeof item.copy === 'string') {
    const copy = item.copy.trim();
    const into = typeof item.into === 'string' ? ` → ${item.into}` : '';
    return `Step ${stepIndex} · copy · ${copy}${into}`;
  }
  if (isRecord(item.bind) || isRecord(item.plan)) {
    const binding = (isRecord(item.bind) ? item.bind : item.plan) as Record<string, unknown>;
    const forId = String(binding.for ?? stepIndex);
    return `Step ${stepIndex} · bind · ${forId}`;
  }
  const { mode: _mode, ...doc } = item;
  const keys = Object.keys(doc);
  if (!keys.length) return undefined;
  const keyLabel = keys.join(', ');
  return `Step ${stepIndex} · ${keyLabel}`;
}

/** Dockerfile recipe from the unit head (not the full inherited image chain). */
export function listTwinfileManifestRecipe(twinfile: Record<string, unknown>): TwinfileManifestRecipe {
  const from =
    typeof twinfile.from === 'string' && twinfile.from.trim() ? twinfile.from.trim() : undefined;

  if (isPatchesTwinfile(twinfile)) {
    const steps: TwinfileManifestBuildStep[] = [];
    twinfileStepItems(twinfile).forEach((item, stepIndex) => {
      const label = manifestStepLabel(item, stepIndex);
      if (label) steps.push({ stepIndex, label });
    });
    return { from, steps };
  }

  const steps = twinfilePlaceLayerPaths(twinfile).map((entry, stepIndex) => ({
    stepIndex,
    label: `Step · ${entry.path}${entry.mode === 'replace' ? ' (replace)' : ''}`,
  }));
  return { from, steps };
}
