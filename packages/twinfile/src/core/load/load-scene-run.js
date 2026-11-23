import { resolve } from 'node:path';
import { isRecord } from '../doc/is-record.js';
import { err, ok } from '../types/twin-error.js';
import { readYamlDocument } from '../validate/validate-yaml.js';
import { findTwinfileYamlPath } from './twinfile-locator.js';
const SCENE_SEPARATOR = '#';
const PLACE_REF = /^twinfile\/place\//;
const RUN_COMPOSE_KEYS = ['steps', 'domains', 'args', 'schedule', 'clock', 'use'];
/** `<story-dir>#<scene-id>` → story folder + scene id. */
export function parseSceneAddress(target) {
    const at = target.lastIndexOf(SCENE_SEPARATOR);
    if (at <= 0 || at === target.length - 1)
        return undefined;
    return { storyRoot: resolve(target.slice(0, at)), sceneId: target.slice(at + 1) };
}
export function isSceneAddress(target) {
    return parseSceneAddress(target) !== undefined;
}
export function sceneAddress(storyRoot, sceneId) {
    return `${resolve(storyRoot)}${SCENE_SEPARATOR}${sceneId}`;
}
/** Path that reloads `loaded`: the scene address for runs, else the unit folder. */
export function unitAddress(loaded) {
    return loaded.scene ? sceneAddress(loaded.root, loaded.scene.id) : loaded.root;
}
function storyScenes(doc) {
    const story = doc.story;
    if (!isRecord(story) || !Array.isArray(story.scenes))
        return [];
    return story.scenes.filter(isRecord);
}
function readStoryHead(storyRoot) {
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
/** Load a `kind: story` unit folder (not a scene run address). */
export function loadStoryUnit(storyRoot) {
    const head = readStoryHead(storyRoot);
    if (!head.ok)
        return head;
    return ok({
        root: resolve(storyRoot),
        twinfilePath: head.value.path,
        twinfile: head.value.doc,
    });
}
/** Scene ids in a story folder that declare an inline `run:`. */
export function listSceneRunIds(storyRoot) {
    const head = readStoryHead(storyRoot);
    if (!head.ok)
        return [];
    return storyScenes(head.value.doc)
        .filter((scene) => isRecord(scene.run) && typeof scene.id === 'string')
        .map((scene) => String(scene.id));
}
/** `links` entries with `rel: involves` whose href is a place ref. */
function involvesPlaceRefs(doc) {
    if (!Array.isArray(doc.links))
        return [];
    return doc.links.flatMap((link) => {
        if (!isRecord(link) || link.rel !== 'involves' || typeof link.href !== 'string')
            return [];
        return PLACE_REF.test(link.href) ? [link.href] : [];
    });
}
/** Explicit `run.from`, else the story's single involves place ref. */
function resolveRunFrom(story, scene, file) {
    const run = scene.run;
    if (typeof run.from === 'string' && run.from.trim())
        return ok(run.from.trim());
    const places = involvesPlaceRefs(story);
    if (places.length === 1)
        return ok(places[0]);
    const sceneId = String(scene.id);
    if (places.length === 0) {
        return err([
            {
                code: 'E_SCHEMA',
                message: `scene ${sceneId} run requires from: (or a links involves place)`,
                file,
            },
        ]);
    }
    return err([
        {
            code: 'E_SCHEMA',
            message: `scene ${sceneId} run requires from: (ambiguous involves place links)`,
            file,
        },
    ]);
}
function sceneRunErrors(scene, file) {
    const run = scene.run;
    if (typeof run === 'string') {
        return [{ code: 'E_SCHEMA', message: 'scene run: must be an inline mapping, not a folder path', file }];
    }
    if (!isRecord(run))
        return [{ code: 'E_SCHEMA', message: `scene ${String(scene.id)} has no run:`, file }];
    return [];
}
function runComposeHead(story, scene, from) {
    const run = scene.run;
    const head = {
        twinfile: 2,
        kind: 'scenario',
        role: 'run',
        id: scene.id,
        ...(typeof scene.label === 'string' ? { name: scene.label } : {}),
        version: story.version ?? '1.0.0',
        ...(story.stability ? { stability: story.stability } : {}),
        from,
    };
    for (const key of RUN_COMPOSE_KEYS) {
        if (run[key] !== undefined)
            head[key] = structuredClone(run[key]);
    }
    return head;
}
/** Load one story scene run (`<story-dir>#<scene-id>`) as a compose head. */
export function loadRunUnit(target) {
    const address = parseSceneAddress(target);
    if (!address) {
        return err([{ code: 'E_SCHEMA', message: 'Run target must be <story-dir>#<scene-id>', file: target }]);
    }
    const head = readStoryHead(address.storyRoot);
    if (!head.ok)
        return head;
    const { path, doc } = head.value;
    const scene = storyScenes(doc).find((row) => row.id === address.sceneId);
    if (!scene) {
        const known = listSceneRunIds(address.storyRoot).join(', ') || 'none';
        return err([{ code: 'E_SCHEMA', message: `unknown scene ${address.sceneId} (runs: ${known})`, file: path }]);
    }
    const shapeErrors = sceneRunErrors(scene, path);
    if (shapeErrors.length > 0)
        return err(shapeErrors);
    const from = resolveRunFrom(doc, scene, path);
    if (!from.ok)
        return from;
    return ok({
        root: address.storyRoot,
        twinfilePath: path,
        twinfile: runComposeHead(doc, scene, from.value),
        scene: { id: address.sceneId },
    });
}
