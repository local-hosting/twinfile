import { defaultViewerCatalogDir, viewerRootsFromPaths } from './catalog/viewer-catalog.js';
import { resolveDefaultViewerIncorporate } from './default-viewer-catalogs.js';
import { startWorkbench, type StartWorkbenchOptions } from './start-workbench.js';
import { parseViewerCliArgs } from './viewer-cli-args.js';

export type RunViewerCliOptions = {
  staticRoot?: string;
  logPrefix?: string;
};

/** `twin-view [catalog...] [--port N]` — default: `examples` + `simulator/`. */
export function runViewerCli(argv: string[], options: RunViewerCliOptions = {}): void {
  const logPrefix = options.logPrefix ?? 'viewer';
  const { port, incorporate: explicit } = parseViewerCliArgs(argv);
  const catalogs = explicit.length > 0 ? explicit : resolveDefaultViewerIncorporate();
  if (catalogs.length === 0) {
    console.error(
      `${logPrefix}: no catalog roots — pass directories, or set TF_TWINFILE_ROOT`,
    );
    process.exit(1);
  }
  const roots = viewerRootsFromPaths(catalogs);
  const dir = defaultViewerCatalogDir(catalogs, roots);
  console.log(`${logPrefix}: ${catalogs.length} catalog(s) → ${dir}`);
  const startOpts: StartWorkbenchOptions = { incorporate: catalogs };
  if (options.staticRoot) startOpts.staticRoot = options.staticRoot;
  startWorkbench(dir, port, startOpts);
}
