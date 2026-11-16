#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../..');
const BASES = [
  path.join(ROOT, 'catalog/character'),
  path.join(ROOT, 'catalog/story'),
  path.join(ROOT, 'packages'),
  path.join(ROOT, '..', 'catalog-host'),
].filter((p) => fs.existsSync(p));

const REPLACEMENTS = [
  ['pcm-instance-variation', 'character-instance-variation'],
  ['pcm-instance-rng', 'character-instance-rng'],
  ['hydrate-pcm-signals-from-dimensions', 'hydrate-character-signals-from-dimensions'],
  ['pcm-catalog-display', 'character-catalog-display'],
  ['pcm-segment-topics', 'character-segment-topics'],
  ['pcm-segment-facets', 'character-segment-facets'],
  ['persona-segment-facets', 'character-segment-facets'],
  ['persona-segment-topics', 'character-segment-topics'],
  ['normalize-pcm-input', 'normalize-character-input'],
  ['normalizePCMInput', 'normalizeCharacterInput'],
  ['narrativeple-pcm-demographic-bands', 'sample-character-demographic-bands'],
  ['narrativeple-character-demographic-bands', 'sample-character-demographic-bands'],
  ['PCM_SPEC_VERSION', 'CHARACTER_SPEC_VERSION'],
  ['export type { PCM, CharacterDocument }', 'export type { Character, CharacterDocument }'],
  ['export type { PCM }', 'export type { Character }'],
  ['type PCM ', 'type Character '],
  ['type PCM=', 'type Character='],
  ['type PCM,', 'type Character,'],
  ['type PCM]', 'type Character]'],
  ['type PCM}', 'type Character}'],
  ['type PCM;', 'type Character;'],
  ['(pcm: PCM)', '(character: Character)'],
  [' pcm: PCM', ' character: Character'],
  ['const pcm: PCM', 'const character: Character'],
  ['as PCM', 'as Character'],
  [': PCM', ': Character'],
  ['<PCM>', '<Character>'],
  ['PCM)', 'Character)'],
  ['export type PCM =', 'export type Character ='],
  ['export type SAM =', 'export type Story ='],
  ['type SAM ', 'type Story '],
  ['type SAM,', 'type Story,'],
  ['type SAM]', 'type Story]'],
  ['type SAM}', 'type Story}'],
  ['type SAM;', 'type Story;'],
  ['const sam: SAM', 'const story: Story'],
  [' sam: SAM', ' story: Story'],
  ['as SAM', 'as Story'],
  [': SAM', ': Story'],
  ['<SAM>', '<Story>'],
  ['Partial<SAM>', 'Partial<Story>'],
  ['import type { SAM', 'import type { Story'],
  ['StoryNarrativeSpecVersion', 'StoryNarrativeSpecVersion'],
  ['Browser-safe PCM', 'Browser-safe character'],
  ['Object-oriented PCM', 'Object-oriented character'],
  ['#pcm', '#character'],
  ['/** PCMSpec', '/** Character spec'],
  ['PCM/AXM', 'Character/AXM'],
  ['PCM/JSM', 'Character/situations'],
  ['PCMs ', 'Characters '],
  ['not PCM', 'not character'],
  ['class CharacterDocument {', 'class CharacterBundle {'],
  ['CharacterDocument.from', 'CharacterBundle.from'],
  ['CharacterDocumentClass', 'CharacterBundle'],
  ['export { CharacterDocument } from', 'export { CharacterBundle } from'],
  ['CharacterStoryInstanceDocument', 'CharacterStoryInstanceDocument'],
  ['sam-story-instance-document', 'story-instance-document'],
  ['pcm-sam-story-run', 'character-story-run'],
  ['resolve-sam-episode', 'resolve-story-episode'],
  ['sam-journey', 'story-narrative-journey'],
  ['storyboard-sam-fixture', 'storyboard-story-fixture'],
  ['storyboardSamFixture', 'storyboardStoryFixture'],
  ['SamJourneyContext', 'StoryJourneyContext'],
  ['parseStory', 'parseStoryNarrative'],
  ['loadLegacyTenantSam', 'loadLegacyTenantStory'],
];

const EXT = new Set(['.ts', '.tsx', '.md', '.json', '.yml', '.yaml']);

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    if (name === 'node_modules' || name === 'dist') continue;
    const p = path.join(dir, name);
    if (!fs.existsSync(p)) continue;
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (EXT.has(path.extname(name)) && !name.endsWith('.d.ts.map')) out.push(p);
  }
  return out;
}

function fixPcmTypeAlias(text) {
  return text.replace(/\bPCM\b/g, (match, offset, full) => {
    if (full.slice(offset - 4, offset) === 'type ') return 'Character';
    if (full.slice(Math.max(0, offset - 20), offset).includes('export type Character')) return match;
    return 'Character';
  });
}

function fixSamTypeAlias(text) {
  return text.replace(/\bSAM\b/g, 'Story');
}

for (const base of BASES) {
  for (const file of walk(base)) {
    let text = fs.readFileSync(file, 'utf8');
    let next = text;
    for (const [a, b] of REPLACEMENTS) next = next.split(a).join(b);
    if (base.includes('catalog/character') || base.includes('catalog-host')) {
      next = fixPcmTypeAlias(next);
    }
    if (base.includes('catalog/story') || base.includes('catalog-host')) {
      next = fixSamTypeAlias(next);
    }
    if (next !== text) fs.writeFileSync(file, next);
  }
}

// rename test files
const renames = [
  ['catalog/story/test/narrative/story/pcm-sam-story-run.test.ts', 'catalog/story/test/narrative/story/character-story-run.test.ts'],
  ['catalog/character/test/persona/pcm-catalog-display.test.ts', 'catalog/character/test/persona/character-catalog-display.test.ts'],
  ['catalog/character/test/persona/pcm-json.test.ts', 'catalog/character/test/persona/character-json.test.ts'],
  ['catalog/character/test/persona/pcm-spec.test.ts', 'catalog/character/test/persona/character-spec.test.ts'],
  ['catalog/character/test/persona/pcm-story-instance-document.test.ts', 'catalog/character/test/persona/character-story-instance-document.test.ts'],
  ['catalog/character/test/persona/story/hydrate-pcm-signals-from-dimensions.test.ts', 'catalog/character/test/persona/story/hydrate-character-signals-from-dimensions.test.ts'],
  ['catalog/character/test/persona/audience/pcm-audience-plane.test.ts', 'catalog/character/test/persona/audience/character-audience-plane.test.ts'],
  ['catalog/story/test/narrative/sam-scenes.test.ts', 'catalog/story/test/narrative/story-scenes.test.ts'],
  ['catalog/story/test/narrative/sam-associations.test.ts', 'catalog/story/test/narrative/story-associations.test.ts'],
  ['catalog/story/test/narrative/sam-journey.test.ts', 'catalog/story/test/narrative/story-journey.test.ts'],
  ['catalog/story/test/narrative/sam-story-instance-document.test.ts', 'catalog/story/test/narrative/story-instance-document.test.ts'],
  ['catalog/story/test/narrative/project-story-dimensions-from-sam.test.ts', 'catalog/story/test/narrative/project-story-dimensions-from-story.test.ts'],
  ['catalog/story/test/narrative/helpers/storyboard-sam-fixture.ts', 'catalog/story/test/narrative/helpers/storyboard-story-fixture.ts'],
  ['catalog/story/test/narrative/story/assemble-believable-episode-from-pcm.test.ts', 'catalog/story/test/narrative/story/assemble-believable-episode-from-character.test.ts'],
  ['catalog/character/test/fixtures/axm/pcm-ids.yml', 'catalog/character/test/fixtures/axm/character-ids.yml'],
];

for (const [from, to] of renames) {
  const a = path.join(ROOT, from);
  const b = path.join(ROOT, to);
  if (fs.existsSync(a) && !fs.existsSync(b)) fs.renameSync(a, b);
}

console.log('fix2 done');