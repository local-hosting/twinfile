#!/usr/bin/env node
/**
 * Enforces GOVERNANCE.md: RFC shape, and (on PR diffs) normative changes paired with RFCs.
 */
import { execSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const rfcsDir = join(root, 'rfcs');

const REQUIRED_SECTIONS = [
  '## Summary',
  '## Motivation',
  '## Specification',
  '## Conformance',
];

const NORMATIVE_PREFIXES = [
  'schemas/',
  'conf/index.json',
  'doc/kinds/',
  'doc/place/',
  'doc/build/',
  'doc/pack/',
  'doc/gov/transparency.md',
];

const ACCEPTED_STATUSES = new Set([
  'accepted',
  'accepted (bootstrap 1.0.0-draft.1)',
  'accepted (bootstrap)',
]);

function listRfcs() {
  return readdirSync(rfcsDir)
    .filter((name) => /^0\d{3}-.+\.md$/.test(name) && name !== '0000-template.md')
    .sort();
}

function parseRfcMeta(body) {
  const statusMatch = body.match(/^Status:\s*(.+)$/m);
  const createdMatch = body.match(/^Created:\s*(\d{4}-\d{2}-\d{2})$/m);
  return {
    status: statusMatch?.[1]?.trim().toLowerCase() ?? '',
    created: createdMatch?.[1] ?? '',
  };
}

function sectionHasContent(body, heading) {
  const idx = body.indexOf(heading);
  if (idx < 0) return false;
  const rest = body.slice(idx + heading.length);
  const next = rest.search(/\n## /);
  const chunk = (next >= 0 ? rest.slice(0, next) : rest).trim();
  return chunk.length >= 40;
}

function checkRfcFiles() {
  const issues = [];
  for (const name of listRfcs()) {
    const path = join(rfcsDir, name);
    const body = readFileSync(path, 'utf8');
    for (const heading of REQUIRED_SECTIONS) {
      if (!body.includes(heading)) {
        issues.push(`${name}: missing ${heading}`);
      } else if (!sectionHasContent(body, heading)) {
        issues.push(`${name}: ${heading} needs substantive text (≥40 chars)`);
      }
    }
    const meta = parseRfcMeta(body);
    if (!meta.status) {
      issues.push(`${name}: missing \`Status:\` line (see rfcs/0000-template.md)`);
    }
    if (!meta.created) {
      issues.push(`${name}: missing \`Created: YYYY-MM-DD\``);
    }
  }
  return issues;
}

function gitDiffNames(baseRef) {
  try {
    const out = execSync(`git diff --name-only ${baseRef}...HEAD`, {
      cwd: root,
      encoding: 'utf8',
    });
    return out
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function isNormativePath(path) {
  return NORMATIVE_PREFIXES.some((p) => path.startsWith(p) || path === p);
}

function daysBetween(isoStart, isoEnd) {
  const a = new Date(`${isoStart}T00:00:00Z`).getTime();
  const b = new Date(`${isoEnd}T00:00:00Z`).getTime();
  return Math.floor((b - a) / (24 * 60 * 60 * 1000));
}

function checkDiffGovernance() {
  const baseRef = process.env.GOV_BASE_REF ?? 'origin/main';
  const changed = gitDiffNames(baseRef);
  if (!changed.length) return [];

  const normative = changed.filter(isNormativePath);
  const rfcChanges = changed.filter((p) => p.startsWith('rfcs/') && !p.endsWith('0000-template.md'));
  if (!normative.length) return [];

  const issues = [];
  if (!rfcChanges.length) {
    issues.push(
      'normative paths changed without any RFC update — add or amend an RFC in rfcs/',
    );
    return issues;
  }

  const today = new Date().toISOString().slice(0, 10);
  for (const rfcPath of rfcChanges) {
    const full = join(root, rfcPath);
    if (!statSync(full, { throwIfNoEntry: false })?.isFile()) continue;
    const body = readFileSync(full, 'utf8');
    const meta = parseRfcMeta(body);
    if (!meta.status) {
      issues.push(`${rfcPath}: missing Status for normative pairing`);
      continue;
    }
    if (ACCEPTED_STATUSES.has(meta.status)) continue;
    if (meta.status === 'proposed') {
      if (!meta.created) {
        issues.push(`${rfcPath}: Proposed RFC needs Created date for 7-day rule`);
        continue;
      }
      const age = daysBetween(meta.created, today);
      if (age < 7) {
        issues.push(
          `${rfcPath}: Proposed RFC is ${age} days old (need 7 before normative merge)`,
        );
      }
      continue;
    }
    issues.push(`${rfcPath}: unknown Status "${meta.status}"`);
  }
  return issues;
}

const staticIssues = checkRfcFiles();
const diffIssues =
  process.env.CHECK_GOV_DIFF === '1' || process.env.GITHUB_EVENT_NAME === 'pull_request'
    ? checkDiffGovernance()
    : [];

const all = [...staticIssues, ...diffIssues];
if (all.length) {
  console.error('check-governance failed:\n' + all.map((l) => `  - ${l}`).join('\n'));
  process.exit(1);
}
console.log('check-governance ok');
