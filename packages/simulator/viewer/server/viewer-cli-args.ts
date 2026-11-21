import { resolveIncorporatePath } from './catalog/viewer-catalog.js';

export type ViewerCliArgs = { port: number; incorporate: string[] };

export function parseViewerCliArgs(argv: string[]): ViewerCliArgs {
  let port = 4173;
  const incorporate: string[] = [];
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]!;
    if (arg === '--port') {
      port = Number(argv[i + 1]);
      i += 1;
      continue;
    }
    if (!arg.startsWith('-')) incorporate.push(resolveIncorporatePath(arg));
  }
  return { port, incorporate };
}
