#!/usr/bin/env node
/** Remove stray `.ts` under dist/ (not `.d.ts`) so `tsc` does not treat them as inputs. */
import { readdirSync, rmSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = join(fileURLToPath(new URL('.', import.meta.url)), '..', 'dist');

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const st = statSync(path);
    if (st.isDirectory()) walk(path);
    else if (name.endsWith('.ts') && !name.endsWith('.d.ts')) rmSync(path);
  }
}

if (statSync(dist, { throwIfNoEntry: false })?.isDirectory()) walk(dist);