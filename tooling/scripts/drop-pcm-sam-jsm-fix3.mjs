#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../..');

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    if (name === 'node_modules' || name === 'dist') continue;
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (p.endsWith('.ts') && !p.endsWith('.d.ts.map')) out.push(p);
  }
  return out;
}

function fixIdentifiers(text) {
  let next = text;
  // preserve string/path tokens
  const placeholders = [];
  next = next.replace(/(['"`][^'"`]*\bpcm[^'"`]*['"`])/g, (m) => {
    const id = `__PCMSTR_${placeholders.length}__`;
    placeholders.push(m);
    return id;
  });
  next = next.replace(/(['"`][^'"`]*\bsam[^'"`]*['"`])/g, (m) => {
    const id = `__SAMSTR_${placeholders.length}__`;
    placeholders.push(m);
    return id;
  });
  next = next.replace(/\bpcm\b/g, 'character');
  next = next.replace(/\bsam\b/g, 'story');
  placeholders.forEach((m, i) => {
    next = next.replace(`__PCMSTR_${i}__`, m);
    next = next.replace(`__SAMSTR_${i}__`, m);
  });
  return next;
}

const charSrc = path.join(ROOT, 'catalog/character/src');
const storySrc = path.join(ROOT, 'catalog/story/src');
const charTest = path.join(ROOT, 'catalog/character/test');
const storyTest = path.join(ROOT, 'catalog/story/test');
const locker = path.join(ROOT, '..', 'fieldwise-locker');

for (const base of [charSrc, charTest, storySrc, storyTest, locker]) {
  if (!fs.existsSync(base)) continue;
  for (const file of walk(base)) {
    const text = fs.readFileSync(file, 'utf8');
    const next = fixIdentifiers(text);
    if (next !== text) fs.writeFileSync(file, next);
  }
}

const EXTRA = [
  ['CharacterBundle.from(character: Character): CharacterDocument', 'CharacterBundle.from(character: Character): CharacterBundle'],
  ['new CharacterDocument(', 'new CharacterBundle('],
  ['static from(character: Character): CharacterDocument', 'static from(character: Character): CharacterBundle'],
  ['static fromJSON(json: unknown): CharacterDocument', 'static fromJSON(json: unknown): CharacterBundle'],
  ['this.#character = pcm', 'this.#character = character'],
  ['loadPcmSegmentFacetFiles', 'loadCharacterSegmentFacetFiles'],
  ['savePcmSegmentFacetFiles', 'saveCharacterSegmentFacetFiles'],
  ['samSpec', 'storySpec'],
  ['pcmSpec', 'characterSpec'],
  ['parseStoryNarrative', 'parseStory'],
  ['{ ok: true, pcm: data }', '{ ok: true, character: data }'],
  ['return { pcm }', 'return { character }'],
  ["'pcm' does not exist", "'character'"],
];

for (const base of [charSrc, charTest, storySrc, storyTest, locker]) {
  if (!fs.existsSync(base)) continue;
  for (const file of walk(base)) {
    let text = fs.readFileSync(file, 'utf8');
    let next = text;
    for (const [a, b] of EXTRA) next = next.split(a).join(b);
    if (next !== text) fs.writeFileSync(file, next);
  }
}

console.log('fix3 done');