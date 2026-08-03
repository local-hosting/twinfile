import { resolve } from 'node:path';

import { isRecord } from '../doc/is-record.js';
import type { Result, TwinError } from '../types/twin-error.js';
import { err, ok } from '../types/twin-error.js';
import type { SceneExpected } from '../types/scene-run.js';
import { readYamlDocument } from '../validate/validate-yaml.js';

import type { LoadedTwinfile } from './load-twinfile.js';
import { findTwinfileYamlPath } from './twinfile-locator.js';

const SCENE_SEPARATOR = '#';

const RUN_COMPOSE_KEYS = ['steps', 'domains', 'args', 'schedule', 'clock', 'use'] as const;

export type SceneAddress = { storyRoot: string; sceneId: string };

/** `<story-dir>#<scene-id>` → story folder + scene id. */
export function parseSceneAddress(target: string): SceneAddress | undefined {
  const at = target.lastIndexOf(SCENE_SEPARATOR);
  if (at <= 0 || at === target.length - 1) return undefined;
  return { storyRoot: resolve(target.slice(0, at)), sceneId: target.slice(at + 1) };
}

export function isSceneAddress(target: string): boolean {
  return parseSceneAddress(target) !== undefined;
}

export function sceneAddress(storyRoot: string, sceneId: string): string {
  return `${resolve(storyRoot)}${SCENE_SEPARATOR}${sceneId}`;
}

/** Path that reloads `loaded`: the scene address for runs, else the unit folder. */
export function unitAddress(loaded: Pick<LoadedTwinfile, 'root' | 'scene'>): string {
  return loaded.scene ? sceneAddress(loaded.root, loaded.scene.id) : loaded.root;
}

function storyScenes(doc: Record<string, unknown>): Record<string, unknown>[] {
  const story = doc.story;
  if (!isRecord(story) || !Array.isArray(story.scenes)) return [];
  return story.scenes.filter(isRecord);
}

function readStoryHead(storyRoot: string): Result<{ path: string; doc: Record<string, unknown> }> {
  const path = findTwinfileYamlPath(storyRoot);
  if (!path) {
    return err([{ code: 'E_MISSING_FILE', message: 'Scene address needs a story folder', file: storyRoot }]);
  }
  const { value } = readYamlDocument(path);
  if (!isRecord(value) || value.kind !== 'story') {
    return err([{ code: 'E_SCHEMA', message: 'Scene address must point at a kind: story head', file: path }]);
  }
  return ok({ path, doc: value });
}

/** Scene ids in a story folder that declare an inline `run:`. */
export function listSceneRunIds(storyRoot: string): string[] {
  const head = readStoryHead(storyRoot);
  if (!head.ok) return [];
  return storyScenes(head.value.doc)
    .filter((scene) => isRecord(scene.run) && typeof scene.id === 'string')
    .map((scene) => String(scene.id));
}

function sceneRunErrors(scene: Record<string, unknown>, file: string): TwinError[] {
  const run = scene.run;
  if (typeof run === 'string') {
    return [{ code: 'E_SCHEMA', message: 'scene run: must be an inline mapping, not a folder path', file }];
  }
  if (!isRecord(run)) return [{ code: 'E_SCHEMA', message: `scene ${String(scene.id)} has no run:`, file }];
  if (typeof run.from !== 'string' || !run.from.trim()) {
    return [{ code: 'E_SCHEMA', message: `scene ${String(scene.id)} run requires from:`, file }];
  }
  return [];
}

function runComposeHead(story: Record<string, unknown>, scene: Record<string, unknown>): Record<string, unknown> {
  const run = scene.run as Record<string, unknown>;
  const head: Record<string, unknown> = {
    twinfile: 2,
    kind: 'scenario',
    role: 'run',
    id: scene.id,
    ...(typeof scene.label === 'string' ? { name: scene.label } : {}),
    version: story.version ?? '1.0.0',
    ...(story.stability ? { stability: story.stability } : {}),
    from: run.from,
  };
  for (const key of RUN_COMPOSE_KEYS) {
    if (run[key] !== undefined) head[key] = structuredClone(run[key]);
  }
  return head;
}

/** Load one story scene run (`<story-dir>#<scene-id>`) as a compose head. */
export function loadRunUnit(target: string): Result<LoadedTwinfile> {
  const address = parseSceneAddress(target);
  if (!address) {
    return err([{ code: 'E_SCHEMA', message: 'Run target must be <story-dir>#<scene-id>', file: target }]);
  }
  const head = readStoryHead(address.storyRoot);
  if (!head.ok) return head;
  const { path, doc } = head.value;
  const scene = storyScenes(doc).find((row) => row.id === address.sceneId);
  if (!scene) {
    const known = listSceneRunIds(address.storyRoot).join(', ') || 'none';
    return err([{ code: 'E_SCHEMA', message: `unknown scene ${address.sceneId} (runs: ${known})`, file: path }]);
  }
  const errors = sceneRunErrors(scene, path);
  if (errors.length > 0) return err(errors);
  const expected = (scene.run as { expected?: SceneExpected }).expected;
  return ok({
    root: address.storyRoot,
    twinfilePath: path,
    twinfile: runComposeHead(doc, scene),
    scene: { id: address.sceneId, ...(expected ? { expected } : {}) },
  });
}
