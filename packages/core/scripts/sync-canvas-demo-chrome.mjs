#!/usr/bin/env node
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const coreRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const outPaths = [
  join(coreRoot, 'canvas', 'demo-project-content.json'),
  join(coreRoot, '..', '..', 'catalog', 'conf', 'canvas-demo.chrome.json'),
];

const { loadCanvasDemoChrome, writeCanvasDemoChromeJson } = await import('../dist/canvas/load-canvas-demo-chrome.js');
for (const outPath of outPaths) {
  mkdirSync(dirname(outPath), { recursive: true });
  writeCanvasDemoChromeJson(outPath);
  console.log(`ok canvas demo chrome → ${outPath}`);
}
const content = loadCanvasDemoChrome();
console.log(
  JSON.stringify(
    {
      places: content.places.length,
      characters: content.characters.length,
      stories: content.stories.length,
      resources: content.resources.length,
      events: content.events.length,
    },
    null,
    2,
  ),
);