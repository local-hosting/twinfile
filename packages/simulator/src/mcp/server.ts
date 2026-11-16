import { join } from 'node:path';

import {
  explainField,
  queryPlace,
  createPlaceFromMcp,
  openServedPlace,
  type McpServeOptions,
} from '@doppler-group/twinfile-place';
import {
  checkProcessorGraph,
  loadTwinfile,
  loadUnitRoot,
  queryPath,
  runScenarioRunner,
} from '@doppler-group/twinfile-core';
import { ContractChecker, performBridgeImport, type PlaceData } from '@doppler-group/twinfile-core';
import { distRootFromCli, resolveRunnerCommand } from '@doppler-group/twinfile-core/cli';
import {
  listMcpRunTestPrompts,
  mcpRunTestPromptForRun,
  resolveMcpRunTestPromptsRoot,
} from '@doppler-group/twinfile-core/mcp';

import { PlaceHost } from '../host/place-host.js';
import { openPlaceTimeline } from '../place/tf-place-timeline.js';
import { createRunPayloadFromTFPlace } from '../runners/run-payload.js';
import { resolveScrubT } from '../timeline/scrub.js';
import { TFPlace } from '../types/tf-runtime.js';

export type McpRequest = {
  method?: string;
  params?: Record<string, unknown>;
};

export type { McpServeOptions };

export async function handleMcpRequest(
  unitDir: string,
  req: McpRequest,
  options: McpServeOptions = {},
): Promise<Record<string, unknown>> {
  const method = req.method?.replace(/_/g, '.') ?? '';
  if (method === 'place.init') return createPlaceFromMcp(req.params, unitDir);

  if (method === 'bridge.import') {
    const bridge = typeof req.params?.bridge === 'string' ? req.params.bridge.trim() : '';
    const inputPath = typeof req.params?.input === 'string' ? req.params.input.trim() : '';
    const outDir = typeof req.params?.out === 'string' ? req.params.out.trim() : '';
    if (!bridge || !inputPath || !outDir) {
      return { digest: null, error: 'bridge, input, and out are required' };
    }
    const result = await performBridgeImport({ bridge, inputPath, outDir });
    if (!result.ok) return { digest: null, error: result.error };
    return { digest: null, ok: true, bridge: result.bridgeId, out: result.outDir, files: result.files };
  }

  const opened = await openServedPlace(unitDir, options);
  if (!opened.ok) return { error: opened.error, digest: null };
  const built = opened.built;
  const tfPlace = TFPlace.compose(built);
  const dir = built.loaded.root;
  const digest = tfPlace.digest ?? built.digest;
  const placeData = tfPlace.data;
  if (method === 'place.card') {
    const host = PlaceHost.for(tfPlace);
    const summary = host.summary();
    return {
      digest,
      summary,
      card: summary,
      ascii: host.summaryAscii(),
    };
  }

  if (method === 'place.query') {
    const rows = queryPlace(placeData, {
      collection: String(req.params?.collection ?? 'spaces'),
      id: typeof req.params?.id === 'string' ? req.params.id : undefined,
      role: typeof req.params?.role === 'string' ? req.params.role : undefined,
      level: typeof req.params?.level === 'string' ? req.params.level : undefined,
      kind: typeof req.params?.kind === 'string' ? req.params.kind : undefined,
      space: typeof req.params?.space === 'string' ? req.params.space : undefined,
      extKey:
        typeof req.params?.ext_key === 'string'
          ? req.params.ext_key
          : typeof req.params?.extKey === 'string'
            ? req.params.extKey
            : undefined,
      extValue: (() => {
        const raw = req.params?.ext_value ?? req.params?.extValue;
        return typeof raw === 'string' || typeof raw === 'number' || typeof raw === 'boolean' ? raw : undefined;
      })(),
      limit: Number(req.params?.limit ?? 50),
      ...(req.params?.mode === 'place' ? { mode: req.params.mode } : {}),
    });
    return { digest, records: rows };
  }

  if (method === 'place.path') {
    const stepFree = req.params?.step_free === true || req.params?.step_free === 'true';
    try {
      const result = queryPath(placeData, {
        from: typeof req.params?.from === 'string' ? req.params.from : undefined,
        to: typeof req.params?.to === 'string' ? req.params.to : undefined,
        role: typeof req.params?.role === 'string' ? req.params.role : undefined,
        step_free: stepFree,
      });
      return { digest, ...result };
    } catch (error) {
      return { digest, error: error instanceof Error ? error.message : String(error) };
    }
  }

  if (method === 'explain') {
    const collection = String(req.params?.collection ?? 'spaces');
    const id = String(req.params?.id ?? '');
    const field = req.params?.field as string | undefined;
    return { digest, result: explainField(placeData, collection, id, field) };
  }

  if (method === 'narrate' || method === 'describe') {
    const spaceId = req.params?.space as string | undefined;
    try {
      const host = PlaceHost.for(tfPlace);
      const tParam = req.params?.t;
      const narrative = host.narrative({
        spaceId,
        ...(tParam !== undefined ? { t: Number(tParam) } : {}),
        seed: Number(req.params?.seed ?? 1),
      });
      return { digest, ...narrative };
    } catch (e) {
      return { digest, error: e instanceof Error ? e.message : String(e) };
    }
  }

  if (method === 'twin.match') {
    const expects = req.params?.expects as Record<string, { kind: string; min: number }> | undefined;
    const planRoles = req.params?.planRoles as Record<string, string[]> | undefined;
    const checker = new ContractChecker();
    const errors = expects
      ? checker.checkExpects(placeData as PlaceData, expects, planRoles)
      : [];
    return { digest, ok: errors.length === 0, errors };
  }

  if (method === 'state.at') {
    const clock = tfPlace.clock;
    if (!clock) {
      return { digest, place: placeData, t: Number(req.params?.t ?? 0) };
    }
    const placeMeta = placeData.place as { timezone?: string } | undefined;
    const timezone = placeMeta?.timezone;
    if (!timezone) {
      return { digest, error: 'clock needs place.timezone' };
    }
    const tParam = req.params?.t;
    const atParam = typeof req.params?.at === 'string' ? req.params.at : undefined;
    const localAtParam = typeof req.params?.localAt === 'string' ? req.params.localAt : undefined;
    let t: number;
    try {
      t = resolveScrubT(
        clock,
        {
          t: tParam !== undefined ? Number(tParam) : undefined,
          at: atParam,
          localAt: localAtParam,
        },
        timezone,
      );
    } catch (e) {
      return { digest, error: e instanceof Error ? e.message : String(e) };
    }
    const seeded = TFPlace.compose(built, { seed: Number(req.params?.seed ?? 1) });
    const timeline = openPlaceTimeline(seeded);
    return { digest, place: placeData, t, sample: timeline.at(t) };
  }

  if (method === 'processors.validate' || method === 'patch.validate') {
    const loaded = loadTwinfile(dir);
    if (!loaded.ok) {
      return { digest, ok: false, errors: loaded.errors };
    }
    const graphResult = checkProcessorGraph(loaded.value.twinfile, placeData);
    if (!graphResult.ok) {
      return { digest, ok: false, errors: graphResult.errors };
    }
    return { digest, ok: true, ...graphResult.value };
  }

  if (method === 'run.test.prompt') {
    const examplesRoot = resolveMcpRunTestPromptsRoot(dir);
    if (!examplesRoot) {
      return { digest, error: 'TF_EXAMPLES_ROOT not resolved for served unit' };
    }
    const paramRunId =
      (typeof req.params?.runId === 'string' && req.params.runId.trim()) ||
      (typeof req.params?.run_id === 'string' && req.params.run_id.trim()) ||
      '';
    const unit = loadUnitRoot(dir);
    const runId = paramRunId || (unit.ok ? String(unit.value.twinfile.id ?? '') : '');
    const hit = mcpRunTestPromptForRun(examplesRoot, runId);
    if (!hit) {
      return { digest, error: `no MCP test prompt for run id: ${runId}` };
    }
    return { digest, schema: 'twinfile.mcp.run-test-prompt.v1', ...hit };
  }

  if (method === 'run.test.prompts') {
    const examplesRoot = resolveMcpRunTestPromptsRoot(dir);
    if (!examplesRoot) {
      return { digest, error: 'TF_EXAMPLES_ROOT not resolved for served unit' };
    }
    const prompts = listMcpRunTestPrompts(examplesRoot);
    return { digest, schema: 'twinfile.mcp.run-test-prompts.v1', prompts };
  }

  if (method === 'run.fork' || method === 'run.append') {
    if (!options.allowRuns) {
      return { error: 'runs disabled; restart serve with --allow-runs', digest };
    }
    const loaded = loadUnitRoot(dir);
    if (!loaded.ok) {
      return { error: 'load failed', digest };
    }
    const runner = String((loaded.value.twinfile.use as { runner?: string } | undefined)?.runner ?? '');
    const distRoot = distRootFromCli();
    const resolvedArgs = tfPlace.resolvedArgs ?? {};
    const args = { ...resolvedArgs, ...(req.params?.args as Record<string, unknown> | undefined) };
    const runName =
      method === 'run.append'
        ? String(req.params?.runName ?? `${loaded.value.twinfile.id}-append`)
        : String(req.params?.runName ?? loaded.value.twinfile.id);
    const use = loaded.value.twinfile.use as { runners?: unknown } | undefined;
    const runners = Array.isArray(use?.runners) ? use.runners : undefined;
    const paramPrompt =
      typeof req.params?.test_prompt === 'string'
        ? req.params.test_prompt.trim()
        : typeof req.params?.testPrompt === 'string'
          ? req.params.testPrompt.trim()
          : '';
    const catalogPrompt = (() => {
      const root = resolveMcpRunTestPromptsRoot(dir);
      if (!root) return undefined;
      return mcpRunTestPromptForRun(root, String(loaded.value.twinfile.id ?? ''))?.prompt;
    })();
    const testPrompt = paramPrompt || catalogPrompt;
    const runResult = await runScenarioRunner({
      runnerCommand: resolveRunnerCommand(runner, distRoot),
      payload: createRunPayloadFromTFPlace({
        place: TFPlace.compose(built, { seed: Number(req.params?.seed ?? 1) }),
        layers: built.layers,
        runName,
        args,
        runners: runners as unknown[] | undefined,
        ...(testPrompt ? { testPrompt } : {}),
      }),
      runsDir: join(dir, 'runs'),
      runName,
    });
    return { digest, runName, recordsPath: runResult.recordsPath, metrics: runResult.metrics };
  }

  return { error: `unsupported method ${method}`, digest };
}
