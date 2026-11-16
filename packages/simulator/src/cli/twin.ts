#!/usr/bin/env node
import { pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const entry = join(dirname(fileURLToPath(import.meta.url)), '../../../cli/dist/cli/twin.js');
await import(pathToFileURL(entry).href);