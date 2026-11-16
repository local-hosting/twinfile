#!/usr/bin/env node
/** Fail when a tracked markdown file links to a repo-relative path that does not exist. */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const LINK = /\]\(([^)\s#]+)(?:#[^)]*)?\)/g;
const EXTERNAL = /^(?:[a-z]+:|\/)/i;

function trackedDocs() {
  const out = execFileSync('git', ['ls-files', '*.md', '*.mdx'], { cwd: root, encoding: 'utf8' });
  return out.split('\n').filter((f) => f && !f.endsWith('CHANGELOG.md'));
}

function brokenLinks(file) {
  const text = readFileSync(join(root, file), 'utf8');
  const broken = [];
  for (const [, link] of text.matchAll(LINK)) {
    if (EXTERNAL.test(link)) continue;
    const target = resolve(root, dirname(file), decodeURI(link));
    if (relative(root, target).startsWith('..')) continue;
    if (!existsSync(target)) broken.push(link);
  }
  return broken;
}

const failures = trackedDocs().flatMap((file) => brokenLinks(file).map((link) => `${file} -> ${link}`));
if (failures.length > 0) {
  console.error(`check-doc-links: ${failures.length} broken link(s)\n${failures.join('\n')}`);
  process.exit(1);
}
console.log('check-doc-links ok');
