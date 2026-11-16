import { resolveExamplesRoot } from '@local-hosting/twinfile-core';
import { mcpRunTestPromptForRun } from '@local-hosting/twinfile-core/mcp';

import { resolvePhaseStarts } from '../timeline/phase-starts.js';
import type { ClockSpec } from '../types/twinfile-time.js';
import { buildPlaceNarrative, type PlaceNarrativeInput } from './place-narrative.js';

export {
  buildPlaceNarrative,
  formatTwinMarkdown,
  type TwinNarrative,
  type PlaceNarrativeInput,
  type TrackReadingFact,
  type NarrativeSection,
} from './place-narrative.js';

export type DescribeTwinfileOptions = PlaceNarrativeInput & {
  twinfile?: Record<string, unknown>;
  clock?: ClockSpec;
  resolvedArgs?: Record<string, unknown>;
  /** Examples catalog root; defaults to `TF_EXAMPLES_ROOT` / walk-up from `unitDir`. */
  examplesRoot?: string;
  /** Scenario directory for examples-root discovery when env is unset. */
  unitDir?: string;
};

export function describeTwinAt(options: DescribeTwinfileOptions): ReturnType<typeof buildPlaceNarrative> {
  const examplesRoot = options.examplesRoot ?? resolveExamplesRoot(options.unitDir);
  const runId = typeof options.twinfile?.id === 'string' ? options.twinfile.id.trim() : '';
  const catalogQuestion =
    runId && examplesRoot ? mcpRunTestPromptForRun(examplesRoot, runId)?.prompt : undefined;
  const question =
    (typeof options.twinfile?.question === 'string' ? options.twinfile.question : undefined) ??
    options.scenario?.question ??
    catalogQuestion;
  const name = typeof options.twinfile?.name === 'string' ? options.twinfile.name : options.scenario?.name;
  const situations = options.situations ?? [];
  const phaseStarts =
    options.phaseStarts ??
    (options.clock
      ? resolvePhaseStarts({
          clock: options.clock,
          situations,
          resolvedArgs: options.resolvedArgs ?? {},
        })
      : undefined);

  return buildPlaceNarrative({
    place: options.place,
    spaceId: options.spaceId,
    sample: options.sample,
    situations,
    phaseStarts,
    resolvedArgs: options.resolvedArgs,
    viewMode: options.viewMode ?? options.sample?.mode,
    scenario: { ...(name ? { name } : {}), ...(question ? { question } : {}) },
  });
}
