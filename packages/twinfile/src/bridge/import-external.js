import { mkdirSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { TWIN_HEAD_SUFFIX } from './place-kit.js';
import { resolveBridgeRef } from './resolve-bridge.js';
export { twinId } from './place-kit.js';
export function importExternal(source, input) {
    const bridge = resolveBridgeRef(source);
    if (!bridge.importPlace)
        throw new Error(`bridge ${source} does not support import`);
    const out = bridge.importPlace(input);
    if (out instanceof Promise) {
        throw new Error(`bridge ${source}: async importPlace is not supported in importExternal`);
    }
    return out;
}
function isHeadKey(rel) {
    return !rel.includes('/') && rel.endsWith(TWIN_HEAD_SUFFIX);
}
export function writeImportedFiles(dir, files) {
    const head = `${basename(resolve(dir))}${TWIN_HEAD_SUFFIX}`;
    for (const [rel, body] of Object.entries(files)) {
        const path = join(dir, isHeadKey(rel) ? head : rel);
        mkdirSync(dirname(path), { recursive: true });
        writeFileSync(path, body.endsWith('\n') ? body : `${body}\n`);
    }
}
