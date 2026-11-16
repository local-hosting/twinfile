import {
  finishTwinfileSummary,
  type BuildTwinfileResult,
} from '@local-hosting/twinfile-place';
import {
  isRunComposeHead,
  isRunUnit,
  loadPatchModuleTypeCatalog,
  ProcessorGraph,
  patchModuleUseMode,
  patchModuleWireIo,
  projectPatchGraphForUi,
  formatTwinfileSummaryMarkdown,
  type LoadedTwinfile,
  type PatchGraphV1,
  type PatchUiModule,
  type TwinfileSummaryAspect,
  type TwinfileSummaryV1,
} from '@local-hosting/twinfile-core';
import { PlaceHost, TFPlace } from '@local-hosting/twinfile-simulator';

export type ViewerSummaryPayload = {
  schema: 'twinfile.viewer.summary.v1';
  sectionId: string;
  summary: TwinfileSummaryV1;
  markdown: string;
};

export { summaryInputFromBuild } from '@local-hosting/twinfile-place';

function patchModuleSummary(
  result: BuildTwinfileResult,
  mod: PatchUiModule,
  patch: PatchGraphV1,
  catalog: ReturnType<typeof loadPatchModuleTypeCatalog>,
): TwinfileSummaryV1 {
  const manifest = result.loaded.twinfile;
  const kind = typeof manifest.kind === 'string' ? manifest.kind : 'place';
  const id = typeof manifest.id === 'string' ? manifest.id : typeof manifest.name === 'string' ? manifest.name : 'manifest';
  const name = typeof manifest.name === 'string' ? manifest.name : id;
  const version = typeof manifest.version === 'string' ? manifest.version : '';
  const mode = patchModuleUseMode(mod.type, catalog);
  const wires = patchModuleWireIo(mod.id, patch, catalog);
  const inputs = wires.inputs.map((row) => ({ ...row, mode }));
  const outputs = wires.outputs.map((row) => ({ ...row, mode }));
  const fixed: TwinfileSummaryAspect[] = [];
  if (mod.bind) {
    for (const [key, value] of Object.entries(mod.bind).sort(([a], [b]) => a.localeCompare(b))) {
      fixed.push({ id: `bind.${key}`, label: key, value, mode });
    }
  }
  return finishTwinfileSummary({
    schema: 'twinfile.summary.v1',
    digest: result.digest,
    head: {
      kind,
      id,
      name,
      version,
      ...(typeof manifest.stability === 'string' ? { stability: manifest.stability } : {}),
    },
    header: {
      icon: '◇',
      name: mod.id,
      subtitle: mod.type,
    },
    fixed,
    variables: [],
    io: { inputs, outputs },
  });
}

export function buildViewerSummaryPayload(
  result: BuildTwinfileResult,
  sectionId: string,
): ViewerSummaryPayload | undefined {
  if (sectionId === 'summary.head' || sectionId === 'card.head') {
    const summary = PlaceHost.for(TFPlace.compose(result)).summary();
    return {
      schema: 'twinfile.viewer.summary.v1',
      sectionId: 'summary.head',
      summary,
      markdown: formatTwinfileSummaryMarkdown(summary),
    };
  }
  const prefix = sectionId.startsWith('summary.patch.') ? 'summary.patch.' : 'card.patch.';
  if (!sectionId.startsWith(prefix)) {
    return undefined;
  }
  const moduleId = sectionId.slice(prefix.length);
  const patch = ProcessorGraph.parseTwinfile(result.loaded.twinfile)?.graph;
  if (!patch?.modules?.length) {
    return undefined;
  }
  const catalog = loadPatchModuleTypeCatalog();
  const model = projectPatchGraphForUi(patch, catalog);
  const mod = model.modules.find((row) => row.id === moduleId);
  if (!mod) {
    return undefined;
  }
  const summary = patchModuleSummary(result, mod, patch, catalog);
  return {
    schema: 'twinfile.viewer.summary.v1',
    sectionId: `summary.patch.${moduleId}`,
    summary,
    markdown: formatTwinfileSummaryMarkdown(summary),
  };
}

/** Place-card summary only — a place does not “run”; use the Run lens on `preset.yaml`. */
export function viewerShowsSummarySections(
  twinfile: Record<string, unknown>,
  loaded?: Pick<LoadedTwinfile, 'twinfilePath'>,
): boolean {
  if (loaded && isRunUnit(loaded)) return false;
  if (isRunComposeHead(twinfile)) return false;
  const kind = typeof twinfile.kind === 'string' ? twinfile.kind : '';
  if (kind === 'event' || kind === 'mixin' || kind === 'scenario' || kind === 'run') {
    return false;
  }
  return (kind || 'place') === 'place';
}

export function viewerSummarySectionIds(result: BuildTwinfileResult): Array<{ id: string; label: string }> {
  if (!viewerShowsSummarySections(result.loaded.twinfile, result.loaded)) {
    return [];
  }
  const out: Array<{ id: string; label: string }> = [{ id: 'summary.head', label: 'Site' }];
  const patch = ProcessorGraph.parseTwinfile(result.loaded.twinfile)?.graph;
  if (!patch?.modules?.length) {
    return out;
  }
  const model = projectPatchGraphForUi(patch, loadPatchModuleTypeCatalog());
  for (const mod of model.modules) {
    out.push({ id: `summary.patch.${mod.id}`, label: mod.id });
  }
  return out;
}
