import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import yaml from 'js-yaml';

export function readYamlFile(path: string): unknown {
  const raw = readFileSync(path, 'utf8');
  return yaml.load(raw);
}

export function loadEntityDir<T>(dir: string): T[] {
  if (!statSync(dir, { throwIfNoEntry: false })?.isDirectory()) {
    return [];
  }
  const items: T[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isFile()) continue;
    if (!entry.name.endsWith('.yml') && !entry.name.endsWith('.yaml')) continue;
    items.push(readYamlFile(join(dir, entry.name)) as T);
  }
  return items;
}
