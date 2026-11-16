import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

import { homedir } from 'node:os';

type CacheEntry = {
  place: Record<string, unknown>;
};

export class LayerCache {
  readonly #enabled: boolean;
  readonly #root: string;

  constructor(options: { enabled?: boolean; root?: string } = {}) {
    this.#enabled = options.enabled ?? true;
    this.#root = options.root ?? join(homedir(), '.cache', 'twinfile', 'layers');
  }

  get(chainDigest: string): CacheEntry | undefined {
    if (!this.#enabled) return undefined;
    const path = join(this.#root, chainDigest.replace('sha256:', ''), 'entry.json');
    if (!existsSync(path)) return undefined;
    const row = JSON.parse(readFileSync(path, 'utf8')) as CacheEntry;
    return row;
  }

  set(chainDigest: string, place: Record<string, unknown>): void {
    if (!this.#enabled) return;
    const path = join(this.#root, chainDigest.replace('sha256:', ''));
    mkdirSync(path, { recursive: true });
    writeFileSync(join(path, 'entry.json'), JSON.stringify({ chain: chainDigest, place }, null, 2));
  }
}
