import { createServer } from 'node:http';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import '@local-hosting/twinfile-simulator';
import {
  buildTwinfile,
} from '@local-hosting/twinfile-place';
import {
  resolveExamplesRoot,
  resolveExamplesRoots,
  resolveSimulatorRoot,
  resolveSimulatorRoots,
} from '@local-hosting/twinfile-core';

import { readTwinfileOutputCss } from '../styles/read-twinfile-output-css.js';
import {
  buildViewerPreview,
  buildViewerPreviewIndex,
  buildViewerPreviewVariation,
} from './catalog/viewer-preview.js';
import { readViewerTwinfileYaml } from './catalog/viewer-source.js';
import {
  defaultViewerPlaceCardEntryId,
  listViewerPlaceCardCatalog,
  listViewerCatalog,
  resolveDefaultCatalogDir,
  resolveViewerTwinfileDir,
  viewerBuildRootsForDir,
  viewerRootsFromPaths,
  catalogEntryIdForDir,
  resolveViewerResponseUnitId,
  type ViewerRoots,
} from './catalog/viewer-catalog.js';
import { resolveViewerAssetsRoot, resolveWorkbenchStaticRoot } from './resolve-workbench-static.js';
import { handleSessionRoutes } from './session-routes.js';

export type StartWorkbenchOptions = {
  incorporate?: string[];
  staticRoot?: string;
  port?: number;
};

const VIEWER_STATIC_TYPES: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
};

const PREVIEW_JSON = {
  index: 'application/vnd.twinfile.preview.index+json; charset=utf-8',
  variation: 'application/vnd.twinfile.preview.variation+json; charset=utf-8',
  full: 'application/vnd.twinfile.preview.full+json; charset=utf-8',
} as const;

function readJsonBody(req: import('node:http').IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8').trim();
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw) as unknown);
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(
  res: import('node:http').ServerResponse,
  status: number,
  body: unknown,
  contentType = 'application/json; charset=utf-8',
): void {
  res.writeHead(status, { 'Content-Type': contentType });
  res.end(JSON.stringify(body));
}

type PreviewView = keyof typeof PREVIEW_JSON;

function previewViewFromRequest(url: URL, accept: string | undefined): PreviewView {
  const view = url.searchParams.get('view')?.trim();
  if (view === 'full') return 'full';
  if (view === 'variation') return 'variation';
  if (view === 'index') return 'index';
  const variation = url.searchParams.get('variation')?.trim();
  if (variation) return 'variation';
  const a = accept ?? '';
  if (a.includes('application/vnd.twinfile.preview.variation')) return 'variation';
  if (a.includes('application/vnd.twinfile.preview.full')) return 'full';
  if (a.includes('application/vnd.twinfile.preview.index')) return 'index';
  return 'index';
}

function parseRequestUrl(reqUrl: string | undefined): URL {
  return new URL(reqUrl ?? '/', 'http://127.0.0.1');
}

function readViewerStylesheet(viewerRoot: string): string {
  const cssPath = join(viewerRoot, 'viewer.css');
  if (!existsSync(cssPath)) {
    console.warn('viewer: missing viewer.css — run `yarn build:viewer` in @local-hosting/twinfile-simulator');
    return '/* missing viewer.css */';
  }
  return readFileSync(cssPath, 'utf8');
}

function tryReadViewerStatic(
  viewerRoot: string,
  pathname: string,
  prefix: '/assets/' | '/vendor/',
): { body: Buffer; type: string } | undefined {
  if (!pathname.startsWith(prefix)) {
    return undefined;
  }
  const rel = pathname.slice(1);
  if (rel.includes('..')) {
    return undefined;
  }
  const root = resolve(viewerRoot);
  const filePath = resolve(join(viewerRoot, rel));
  if (filePath !== root && !filePath.startsWith(`${root}/`)) {
    return undefined;
  }
  if (!existsSync(filePath)) {
    return undefined;
  }
  const ext = rel.slice(rel.lastIndexOf('.'));
  const type = VIEWER_STATIC_TYPES[ext] ?? 'application/octet-stream';
  return { body: readFileSync(filePath), type };
}

/** Storybook-style workbench HTTP host (`twin-workbench`). */
export function startWorkbench(unitDir: string, port = 4173, options: StartWorkbenchOptions = {}): void {
  const spaRoot = resolveWorkbenchStaticRoot(options.staticRoot);
  const viewerAssetsRoot = resolveViewerAssetsRoot();
  const indexPath = join(spaRoot, 'index.html');
  const readIndexHtml = () => readFileSync(indexPath, 'utf8');
  const viewerCss = readViewerStylesheet(viewerAssetsRoot);
  if (!existsSync(join(viewerAssetsRoot, 'vendor/highlight.js'))) {
    console.warn('viewer: missing vendor/highlight.js (optional)');
  }

  const roots: ViewerRoots =
    options.incorporate && options.incorporate.length > 0
      ? viewerRootsFromPaths(options.incorporate)
      : (() => {
          const examplesRoots = resolveExamplesRoots(unitDir);
          const simulatorRoots = resolveSimulatorRoots(unitDir);
          if (examplesRoots.length === 0) {
            const fallback = resolveExamplesRoot(process.cwd());
            if (fallback) examplesRoots.push(fallback);
          }
          if (simulatorRoots.length === 0) {
            const fallback = resolveSimulatorRoot(process.cwd());
            if (fallback) simulatorRoots.push(fallback);
          }
          return {
            examplesRoots,
            simulatorRoots,
          };
        })();

  const resolvedUnitDir = resolveDefaultCatalogDir(unitDir, roots);
  const defaultUnitId = catalogEntryIdForDir(resolvedUnitDir, roots);

  if (resolve(unitDir) !== resolve(resolvedUnitDir)) {
    console.warn(`workbench: unit dir adjusted ${unitDir} → ${resolvedUnitDir}`);
  }

  const loadBuilt = (activeUnitDir: string) => {
    const buildRoots = viewerBuildRootsForDir(activeUnitDir, roots);
    return buildTwinfile(activeUnitDir, {
      examplesRoot: buildRoots.examplesRoot,
      simulatorRoot: buildRoots.simulatorRoot,
            writeLock: false,
          });
  };

  const unitDirFromRequest = (url: URL) =>
    resolveViewerTwinfileDir(url.searchParams.get('entry') ?? undefined, roots, resolvedUnitDir);

  const lensDirFromRequest = (url: URL) => {
    const lens = url.searchParams.get('lens')?.trim();
    if (!lens) return undefined;
    return resolveViewerTwinfileDir(lens, roots, resolvedUnitDir);
  };

  const sessionDirFromRequest = (url: URL) => lensDirFromRequest(url) ?? unitDirFromRequest(url);

  createServer((req, res) => {
    const url = parseRequestUrl(req.url);

    if (url.pathname === '/viewer.css') {
      res.writeHead(200, { 'Content-Type': 'text/css; charset=utf-8' });
      res.end(viewerCss);
      return;
    }

    if (url.pathname === '/styles/twinfile-output.css') {
      res.writeHead(200, { 'Content-Type': 'text/css; charset=utf-8' });
      res.end(readTwinfileOutputCss());
      return;
    }

    const staticFile =
      tryReadViewerStatic(spaRoot, url.pathname, '/assets/') ??
      tryReadViewerStatic(viewerAssetsRoot, url.pathname, '/vendor/');
    if (staticFile) {
      res.writeHead(200, { 'Content-Type': staticFile.type });
      res.end(staticFile.body);
      return;
    }

    if (url.pathname === '/api/catalog') {
      const placeOnly = url.searchParams.get('scope') === 'place';
      const entries = placeOnly ? listViewerPlaceCardCatalog(roots) : listViewerCatalog(roots);
      sendJson(res, 200, {
        entries,
        defaultEntryId: placeOnly
          ? defaultViewerPlaceCardEntryId(roots, defaultUnitId)
          : defaultUnitId ?? entries[0]?.id ?? null,
      });
      return;
    }

    if (url.pathname === '/api/source') {
      const requestedUnit = url.searchParams.get('entry') ?? undefined;
      const activeDir = unitDirFromRequest(url);
      const source = readViewerTwinfileYaml(activeDir);
      if (!source.ok) {
        sendJson(res, 400, { error: 'load failed', errors: source.errors });
        return;
      }
      const unitId = resolveViewerResponseUnitId(requestedUnit, activeDir, roots);
      sendJson(res, 200, { ...source.value, unitId });
      return;
    }

    if (
      handleSessionRoutes(
        {
          sessionDirFromRequest,
          loadBuilt,
          readJsonBody,
          sendJson,
        },
        url,
        req,
        res,
      )
    ) {
      return;
    }

    if (url.pathname === '/api/preview') {
      const requestedUnit = url.searchParams.get('entry') ?? undefined;
      const activeDir = unitDirFromRequest(url);
      const lensDir = lensDirFromRequest(url);
      const view = previewViewFromRequest(url, req.headers.accept);
      const variationId = url.searchParams.get('variation')?.trim() ?? '';
      void loadBuilt(activeDir).then(async (built) => {
        if (!built.ok) {
          sendJson(res, 500, { error: 'build failed', errors: built.errors });
          return;
        }
        const unitId = resolveViewerResponseUnitId(requestedUnit, activeDir, roots);
        if (view === 'full') {
          sendJson(res, 200, { ...buildViewerPreview(built.value), unitId }, PREVIEW_JSON.full);
          return;
        }
        if (view === 'variation') {
          if (!variationId) {
            sendJson(res, 400, { error: 'missing variation query param' });
            return;
          }
          let sessionBuild = built.value;
          if (lensDir && resolve(lensDir) !== resolve(activeDir)) {
            const lensBuilt = await loadBuilt(lensDir);
            if (lensBuilt.ok) sessionBuild = lensBuilt.value;
          }
          void buildViewerPreviewVariation(built.value, variationId, sessionBuild).then((part) => {
            if ('error' in part) {
              sendJson(res, 404, { error: part.error, variation: variationId });
              return;
            }
            sendJson(res, 200, { ...part, unitId }, PREVIEW_JSON.variation);
          });
          return;
        }
        let sessionBuild = built.value;
        if (lensDir && resolve(lensDir) !== resolve(activeDir)) {
          const lensBuilt = await loadBuilt(lensDir);
          if (lensBuilt.ok) sessionBuild = lensBuilt.value;
        }
        sendJson(res, 200, { ...buildViewerPreviewIndex(built.value, sessionBuild), unitId }, PREVIEW_JSON.index);
      });
      return;
    }

    const spaFile = tryReadSpaFile(spaRoot, url.pathname);
    if (spaFile) {
      res.writeHead(200, { 'Content-Type': spaFile.type });
      res.end(spaFile.body);
      return;
    }

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(readIndexHtml());
  }).listen(port, () => {
    console.log(`viewer http://localhost:${port}/ (API: /api/catalog, /api/preview, /api/source, /api/time/*)`);
  });
}

function tryReadSpaFile(
  spaRoot: string,
  pathname: string,
): { body: Buffer; type: string } | undefined {
  if (pathname === '/' || pathname === '') return undefined;
  const rel = pathname.replace(/^\//, '');
  if (!rel || rel.includes('..')) return undefined;
  const root = resolve(spaRoot);
  const filePath = resolve(join(spaRoot, rel));
  if (filePath !== root && !filePath.startsWith(`${root}/`)) return undefined;
  if (!existsSync(filePath)) return undefined;
  const ext = rel.slice(rel.lastIndexOf('.'));
  const type = VIEWER_STATIC_TYPES[ext] ?? 'application/octet-stream';
  return { body: readFileSync(filePath), type };
}
