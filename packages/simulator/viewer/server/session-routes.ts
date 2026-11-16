import type { IncomingMessage, ServerResponse } from 'node:http';

import { viewerSessionAdvance } from './payloads/viewer-session-advance.js';
import { viewerSampleAt, viewerTimeMetaFromBuild } from './payloads/viewer-time.js';
import type { PlaceBuildLoadResult } from './start-workbench-types.js';

export type SessionRouteContext = {
  sessionDirFromRequest: (url: URL) => string | undefined;
  loadBuilt: (dir: string) => Promise<PlaceBuildLoadResult>;
  readJsonBody: (req: IncomingMessage) => Promise<unknown>;
  sendJson: (res: ServerResponse, status: number, body: unknown, contentType?: string) => void;
};

/** Live workbench transport — timeline in `@doppler-group/twinfile-simulator`, patch glue in `@doppler-group/twinfile-simulator/host`. */
export function handleSessionRoutes(
  ctx: SessionRouteContext,
  url: URL,
  req: IncomingMessage,
  res: ServerResponse,
): boolean {
  if (url.pathname === '/api/time/clock') {
    const sessionDir = ctx.sessionDirFromRequest(url);
    if (!sessionDir) {
      ctx.sendJson(res, 400, { error: 'missing entry' });
      return true;
    }
    void ctx.loadBuilt(sessionDir).then((built) => {
      if (!built.ok) {
        ctx.sendJson(res, 500, { error: 'build failed', errors: built.errors });
        return;
      }
      const time = viewerTimeMetaFromBuild(built.value);
      if (!time) {
        ctx.sendJson(res, 404, { error: 'no scenario clock on this Twinfile' });
        return;
      }
      ctx.sendJson(res, 200, { digest: built.value.digest, ...time });
    });
    return true;
  }

  if (url.pathname === '/api/time/at') {
    const sessionDir = ctx.sessionDirFromRequest(url);
    if (!sessionDir) {
      ctx.sendJson(res, 400, { error: 'missing entry' });
      return true;
    }
    const tParam = url.searchParams.get('t');
    const atParam = url.searchParams.get('at')?.trim();
    const localAtParam = url.searchParams.get('localAt')?.trim();
    const seed = Number(url.searchParams.get('seed') ?? 1);
    void ctx.loadBuilt(sessionDir).then((built) => {
      if (!built.ok) {
        ctx.sendJson(res, 500, { error: 'build failed', errors: built.errors });
        return;
      }
      try {
        const body = viewerSampleAt(
          built.value,
          {
            t: tParam !== null && tParam !== '' ? Number(tParam) : undefined,
            at: atParam || undefined,
            localAt: localAtParam || undefined,
          },
          Number.isFinite(seed) ? seed : 1,
        );
        ctx.sendJson(res, 200, { digest: built.value.digest, ...body });
      } catch (e) {
        ctx.sendJson(res, 400, { error: e instanceof Error ? e.message : String(e) });
      }
    });
    return true;
  }

  if (url.pathname === '/api/time/advance' && req.method === 'POST') {
    const sessionDir = ctx.sessionDirFromRequest(url);
    if (!sessionDir) {
      ctx.sendJson(res, 400, { error: 'missing entry' });
      return true;
    }
    const seed = Number(url.searchParams.get('seed') ?? 1);
    void ctx.readJsonBody(req).then((raw) => {
      const body = (raw ?? {}) as { fromT?: unknown; toT?: unknown; publish?: unknown };
      const toT = Number(body.toT);
      if (!Number.isFinite(toT)) {
        ctx.sendJson(res, 400, { error: 'toT must be a finite number' });
        return;
      }
      const fromT = body.fromT === undefined ? 0 : Number(body.fromT);
      if (!Number.isFinite(fromT)) {
        ctx.sendJson(res, 400, { error: 'fromT must be a finite number' });
        return;
      }
      void ctx.loadBuilt(sessionDir).then((built) => {
        if (!built.ok) {
          ctx.sendJson(res, 500, { error: 'build failed', errors: built.errors });
          return;
        }
        try {
          const payload = viewerSessionAdvance(
            built.value,
            {
              fromT,
              toT,
              publish: body.publish !== false,
            },
            Number.isFinite(seed) ? seed : 1,
          );
          ctx.sendJson(res, 200, payload);
        } catch (e) {
          ctx.sendJson(res, 400, { error: e instanceof Error ? e.message : String(e) });
        }
      });
    });
    return true;
  }

  return false;
}
