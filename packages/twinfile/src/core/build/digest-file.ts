import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

export function digestFileBytes(path: string): string {
  const hex = createHash('sha256').update(readFileSync(path)).digest('hex');
  return `sha256:${hex}`;
}

export function digestBuffer(buf: Buffer): string {
  const hex = createHash('sha256').update(buf).digest('hex');
  return `sha256:${hex}`;
}
