import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils.js';
import { canonicalizeJson } from './merge.js';
export function sha256BufferHex(buf) {
    return `sha256:${bytesToHex(sha256(buf))}`;
}
export function sha256Digest(value) {
    const body = canonicalizeJson(value);
    return sha256BufferHex(utf8ToBytes(body));
}
/** First four bytes of sha256(key) as a unit interval — schedule / simulator variance. */
export function uniformUnitFromSha256Utf8(key) {
    const hash = sha256(utf8ToBytes(key));
    const view = new DataView(hash.buffer, hash.byteOffset, hash.byteLength);
    return view.getUint32(0, false) / 2 ** 32;
}
export function layerChainDigest(input) {
    return sha256Digest({
        parent: input.parent,
        content: input.content,
        kind: input.kind,
        ref: input.ref,
    });
}
export function placeImageDigest(input) {
    return sha256Digest(input);
}
