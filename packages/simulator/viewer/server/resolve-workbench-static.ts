import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Package root (`examples/viewer`), whether running from `server/` or `dist/server/`. */
export function resolveViewerPackageRoot(): string {
  let dir = dirname(fileURLToPath(import.meta.url));
  for (let i = 0; i < 6; i += 1) {
    if (existsSync(join(dir, 'public/index.html')) || existsSync(join(dir, 'assets'))) {
      return dir;
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return join(dirname(fileURLToPath(import.meta.url)), '..');
}

/** Built Tailwind viewer SPA (`index.html` + assets). */
export function resolveWorkbenchStaticRoot(override?: string): string {
  const root = override ?? join(resolveViewerPackageRoot(), 'dist/static');
  if (!existsSync(join(root, 'index.html'))) {
    throw new Error(
      `viewer: missing ${join(root, 'index.html')} — run \`yarn workspace @doppler-group/twinfile-simulator build:viewer\``,
    );
  }
  return root;
}

/** Viewer stylesheet and vendor bundles (`viewer.css`, `vendor/highlight.js`). */
export function resolveViewerAssetsRoot(): string {
  return join(resolveViewerPackageRoot(), 'assets');
}
