import { readFileSync } from 'node:fs';

import { sha256BufferHex } from './digest.js';

export function digestFileBytes(path: string): string {
  return sha256BufferHex(readFileSync(path));
}

export function digestBuffer(buf: Uint8Array): string {
  return sha256BufferHex(buf);
}