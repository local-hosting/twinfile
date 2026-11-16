#!/usr/bin/env node
/**
 * One-shot rename: PCM/SAM/JSM → Character/Story + persona/situations/narrative paths.
 * Run from repo root: node tooling/scripts/drop-pcm-sam-jsm.mjs
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../..');
const TARGETS = [
  path.join(ROOT, 'catalog/character'),
  path.join(ROOT, 'catalog/story'),
  path.join(ROOT, 'packages'),
  path.join(ROOT, '..', 'catalog-host'),
].filter((p) => fs.existsSync(p));

const FILE_RENAMES = [
  // character persona
  ['pcm.ts', 'character.ts'],
  ['pcm-spec.ts', 'character-spec.ts'],
  ['pcm-character.ts', 'character-persona.ts'],
  ['pcm-segment-facets.ts', 'character-segment-facets.ts'],
  ['pcm.schema.ts', 'character.schema.ts'],
  ['pcm-character.schema.ts', 'character-persona.schema.ts'],
  ['pcm-package-meta.ts', 'character-package-meta.ts'],
  ['pcm-document.ts', 'character-document.ts'],
  ['pcm-catalog-display.ts', 'character-catalog-display.ts'],
  ['pcm-segment-topics.ts', 'character-segment-topics.ts'],
  ['load-pcm.ts', 'load-character.ts'],
  ['save-pcm.ts', 'save-character.ts'],
  ['validate-pcm.ts', 'validate-character.ts'],
  ['normalize-pcm-input.ts', 'normalize-character-input.ts'],
  ['load-pcm-story-topics.ts', 'load-character-story-topics.ts'],
  ['pcm-audience.ts', 'character-audience.ts'],
  ['pcm-audience-plane.ts', 'character-audience-plane.ts'],
  ['pcm-audience-plane.schema.ts', 'character-audience-plane.schema.ts'],
  ['pcm-story-instance.ts', 'character-story-instance.ts'],
  ['pcm-instance-variation.ts', 'character-instance-variation.ts'],
  ['materialize-pcm-story-instance.ts', 'materialize-character-story-instance.ts'],
  ['pcm-story-instance-document.ts', 'character-story-instance-document.ts'],
  ['pcm-instance-rng.ts', 'character-instance-rng.ts'],
  ['pcm-story-psychology.ts', 'character-story-psychology.ts'],
  ['hydrate-pcm-signals-from-dimensions.ts', 'hydrate-character-signals-from-dimensions.ts'],
  ['sample-pcm-demographic-bands.ts', 'sample-character-demographic-bands.ts'],
  ['profiles-from-pcm.ts', 'profiles-from-character.ts'],
  // story narrative
  ['sam.ts', 'story-narrative.ts'],
  ['sam-spec.ts', 'story-narrative-spec.ts'],
  ['sam-refs.ts', 'story-refs.ts'],
  ['sam-journey.ts', 'story-narrative-journey.ts'],
  ['sam-character-context.ts', 'story-character-context.ts'],
  ['sam.schema.ts', 'story-narrative.schema.ts'],
  ['sam-document.ts', 'story-document.ts'],
  ['sam-package-meta.ts', 'story-package-meta.ts'],
  ['load-sam.ts', 'load-story.ts'],
  ['save-sam.ts', 'save-story.ts'],
  ['validate-sam.ts', 'validate-story-narrative.ts'],
  ['validate-sam-scenes.ts', 'validate-story-scenes.ts'],
  ['validate-sam-associations.ts', 'validate-story-associations.ts'],
  ['validate-sam-narrative-coherence.ts', 'validate-story-narrative-coherence.ts'],
  ['validate-sam-touchpoint-places.ts', 'validate-story-touchpoint-places.ts'],
  ['validate-sam-story-arc.ts', 'validate-story-story-arc.ts'],
  ['compile-sam.ts', 'compile-story-narrative.ts'],
  ['normalize-sam-input.ts', 'normalize-story-input.ts'],
  ['normalize-sam-associations.ts', 'normalize-story-associations.ts'],
  ['merge-sam-story-dimensions-with-host.ts', 'merge-story-dimensions-with-host.ts'],
  ['project-story-dimensions-from-sam.ts', 'project-story-dimensions-from-story.ts'],
  ['sam-story-instance-document.ts', 'story-instance-document.ts'],
  ['pcm-sam-story-run.ts', 'character-story-run.ts'],
  ['compile-sams-for-catalog.ts', 'compile-stories-for-catalog.ts'],
  ['build-sam-story-catalog-menu.ts', 'build-story-catalog-menu.ts'],
  ['resolve-sam-episode.ts', 'resolve-story-episode.ts'],
  ['resolve-sam-episode-for-pcm.ts', 'resolve-story-episode-for-character.ts'],
  ['resolve-sam-story-instance.ts', 'resolve-story-narrative-instance.ts'],
  ['resolve-journey-for-sam.ts', 'resolve-journey-for-story.ts'],
  ['assemble-believable-episode-from-pcm.ts', 'assemble-believable-episode-from-character.ts'],
  ['story-jsm-narrative-context.ts', 'story-situations-narrative-context.ts'],
  ['jsm-package-meta.ts', 'situations-package-meta.ts'],
  ['jsm-json.test.ts', 'situations-json.test.ts'],
];

const TEXT_REPLACEMENTS = [
  // import paths first
  ['@local-hosting/twinfile-character/pcm/browser', '@local-hosting/twinfile-character/persona/browser'],
  ['@local-hosting/twinfile-character/pcm/', '@local-hosting/twinfile-character/persona/'],
  ['@local-hosting/twinfile-character/pcm', '@local-hosting/twinfile-character/persona'],
  ['@local-hosting/twinfile-character/jsm/', '@local-hosting/twinfile-character/situations/'],
  ['@local-hosting/twinfile-character/jsm', '@local-hosting/twinfile-character/situations'],
  ['@local-hosting/twinfile-story/sam/browser', '@local-hosting/twinfile-story/narrative/browser'],
  ['@local-hosting/twinfile-story/sam/', '@local-hosting/twinfile-story/narrative/'],
  ['@local-hosting/twinfile-story/sam', '@local-hosting/twinfile-story/narrative'],
  // file path segments in imports
  ['/pcm.', '/character.'],
  ['pcm-package-meta', 'character-package-meta'],
  ['pcm-document', 'character-document'],
  ['pcm.schema', 'character.schema'],
  ['pcm-character', 'character-persona'],
  ['pcm-spec', 'character-spec'],
  ['pcm-audience', 'character-audience'],
  ['pcm-story', 'character-story'],
  ['load-pcm', 'load-character'],
  ['save-pcm', 'save-character'],
  ['validate-pcm', 'validate-character'],
  ['materialize-pcm', 'materialize-character'],
  ['profiles-from-pcm', 'profiles-from-character'],
  ['/sam.', '/story-narrative.'],
  ['sam-package-meta', 'story-package-meta'],
  ['sam-document', 'story-document'],
  ['sam.schema', 'story-narrative.schema'],
  ['sam-spec', 'story-narrative-spec'],
  ['sam-refs', 'story-refs'],
  ['load-sam', 'load-story'],
  ['validate-sam', 'validate-story'],
  ['compile-sam', 'compile-story-narrative'],
  ['merge-sam-story', 'merge-story'],
  ['from-sam', 'from-story'],
  ['for-sam', 'for-story'],
  ['for-pcm', 'for-character'],
  ['from-pcm', 'from-character'],
  ['compile-sams', 'compile-stories'],
  ['build-sam-', 'build-story-'],
  ['resolve-sam-', 'resolve-story-'],
  ['jsm-package-meta', 'situations-package-meta'],
  ['jsmToJSON', 'situationsToJSON'],
  ['jsmFromJSON', 'situationsFromJSON'],
  // types (longest first)
  ['PCMDocument', 'CharacterDocument'],
  ['SAMDocument', 'StoryDocument'],
  ['PCMCharacter', 'CharacterPersona'],
  ['PCMSpecVersion', 'CharacterSpecVersion'],
  ['SAMSpecVersion', 'StoryNarrativeSpecVersion'],
  ['PCMEmpathy', 'CharacterEmpathy'],
  ['PCMExemplar', 'CharacterExemplar'],
  ['SAMCharacterRef', 'StoryCharacterRef'],
  ['SAMPlaceRef', 'StoryPlaceRef'],
  ['SAMBinding', 'StoryBinding'],
  ['SAMTouchpointCatalog', 'StoryTouchpointCatalog'],
  ['SAMTouchpointDefinition', 'StoryTouchpointDefinition'],
  ['SAMTouchpointLink', 'StoryTouchpointLink'],
  ['SAMTouchpointLocus', 'StoryTouchpointLocus'],
  ['SAMCharacterContext', 'StoryCharacterContext'],
  ['SAMPlaceMount', 'StoryPlaceMount'],
  ['ValidatePCMResult', 'ValidateCharacterResult'],
  ['ValidateSAMScenesResult', 'ValidateStoryScenesResult'],
  ['LoadPCMResult', 'LoadCharacterResult'],
  ['PcmAxmContribution', 'CharacterAxmContribution'],
  ['PcmJson', 'CharacterJson'],
  ['SamJson', 'StoryJson'],
  ['PcmSegmentFacets', 'CharacterSegmentFacets'],
  ['PcmSegmentStrategy', 'CharacterSegmentStrategy'],
  ['PcmStoryInstance', 'CharacterStoryInstance'],
  ['PcmInstanceCharacteristics', 'CharacterInstanceCharacteristics'],
  ['PcmInstanceVariationPolicy', 'CharacterInstanceVariationPolicy'],
  ['PcmStoryPsychology', 'CharacterStoryPsychology'],
  ['PcmStoryBeatContext', 'CharacterStoryBeatContext'],
  ['PcmAudiencePlane', 'CharacterAudiencePlane'],
  ['PcmAudienceAspectRef', 'CharacterAudienceAspectRef'],
  ['PcmAudienceAspectSource', 'CharacterAudienceAspectSource'],
  ['SamStoryCatalogMenuV1', 'StoryCatalogMenuV1'],
  // classes
  ['PcmDocument', 'CharacterDocumentClass'],
  ['SamDocument', 'StoryDocumentClass'],
  ['PcmStoryInstanceDocument', 'CharacterStoryInstanceDocument'],
  ['SamStoryInstanceDocument', 'StoryInstanceDocument'],
  // functions
  ['pcmToContribution', 'characterToContribution'],
  ['pcmToJSON', 'characterToJSON'],
  ['pcmFromJSON', 'characterFromJSON'],
  ['samToJSON', 'storyToJSON'],
  ['samFromJSON', 'storyFromJSON'],
  ['loadPCM', 'loadCharacter'],
  ['savePCM', 'saveCharacter'],
  ['parsePCM', 'parseCharacter'],
  ['validatePCM', 'validateCharacter'],
  ['loadSAM', 'loadStory'],
  ['parseSAM', 'parseStory'],
  ['compileSAM', 'compileStory'],
  ['validateSAM', 'validateStoryNarrative'],
  ['assertSupportedPCMSpec', 'assertSupportedCharacterSpec'],
  ['pcmSpecVersion', 'characterSpecVersion'],
  ['assertSupportedSAMSpec', 'assertSupportedStoryNarrativeSpec'],
  ['samSpecVersion', 'storyNarrativeSpecVersion'],
  ['pcmCatalogId', 'characterCatalogId'],
  ['pcmCatalogLabel', 'characterCatalogLabel'],
  ['pcmCatalogSegment', 'characterCatalogSegment'],
  ['demographicProfileFromPcm', 'demographicProfileFromCharacter'],
  ['personaProfileFromPcm', 'personaProfileFromCharacter'],
  ['psychographicSegmentProfileFromPcm', 'psychographicSegmentProfileFromCharacter'],
  ['resolvePcmPersonaDisplayName', 'resolveCharacterPersonaDisplayName'],
  ['materializePcmStoryInstance', 'materializeCharacterStoryInstance'],
  ['pickPcmInstanceCharacteristics', 'pickCharacterInstanceCharacteristics'],
  ['hydratePcmSignalsFromDimensions', 'hydrateCharacterSignalsFromDimensions'],
  ['psychologyFromPcmStoryInstance', 'psychologyFromCharacterStoryInstance'],
  ['templateReplyFromPcmAtBeat', 'templateReplyFromCharacterAtBeat'],
  ['segmentIdFromPcmPersonaSegment', 'segmentIdFromCharacterPersonaSegment'],
  ['createPcmInstanceChance', 'createCharacterInstanceChance'],
  ['pcmInstanceRandomFromChance', 'characterInstanceRandomFromChance'],
  ['resolvePcmInstanceRandom', 'resolveCharacterInstanceRandom'],
  ['resolvePcmDemographicPlane', 'resolveCharacterDemographicPlane'],
  ['samplePcmDemographicBands', 'sampleCharacterDemographicBands'],
  ['demographicPlaneFromPcmSignals', 'demographicPlaneFromCharacterSignals'],
  ['MaterializePcmStoryInstanceInput', 'MaterializeCharacterStoryInstanceInput'],
  ['PcmInstanceRandomSource', 'CharacterInstanceRandomSource'],
  ['DEFAULT_PCM_INSTANCE_TRAIT_PICK_COUNT', 'DEFAULT_CHARACTER_INSTANCE_TRAIT_PICK_COUNT'],
  ['DEFAULT_PCM_INSTANCE_VARIATION', 'DEFAULT_CHARACTER_INSTANCE_VARIATION'],
  ['PCM_PACKAGE', 'CHARACTER_PACKAGE'],
  ['SAM_PACKAGE', 'STORY_NARRATIVE_PACKAGE'],
  ['PCM_MENTAL_MODEL_SCOPE_FILE', 'CHARACTER_MENTAL_MODEL_SCOPE_FILE'],
  ['PCM_OBJECTIVES_FILE', 'CHARACTER_OBJECTIVES_FILE'],
  ['PCM_SEGMENT_FACET_FILES', 'CHARACTER_SEGMENT_FACET_FILES'],
  ['PCMSchema', 'CharacterSchema'],
  ['SAMSchema', 'StoryNarrativeSchema'],
  ['PcmAudiencePlaneSchema', 'CharacterAudiencePlaneSchema'],
  ['PcmAudienceAspectRefSchema', 'CharacterAudienceAspectRefSchema'],
  ['normalizePcmAudiencePlane', 'normalizeCharacterAudiencePlane'],
  ['compileSamsForCatalog', 'compileStoriesForCatalog'],
  ['buildSamStoryCatalogMenu', 'buildStoryCatalogMenu'],
  ['resolveSamEpisode', 'resolveStoryEpisode'],
  ['resolveSamEpisodeForPcm', 'resolveStoryEpisodeForCharacter'],
  ['resolveSamStoryInstance', 'resolveStoryNarrativeInstance'],
  ['projectStoryDimensionsFromSam', 'projectStoryDimensionsFromNarrative'],
  ['mergeSamStoryDimensionsWithHost', 'mergeStoryDimensionsWithHost'],
  ['assembleBelievableEpisodeFromPcm', 'assembleBelievableEpisodeFromCharacter'],
  ['buildPcmSamStoryRun', 'buildCharacterStoryRun'],
  ['validateSAMScenes', 'validateStoryScenes'],
  ['validateSAMAssociations', 'validateStoryAssociations'],
  ['validateSAMNarrativeCoherence', 'validateStoryNarrativeCoherence'],
  ['validateSAMTouchpointPlaces', 'validateStoryTouchpointPlaces'],
  ['validateSAMStoryArc', 'validateStoryStoryArc'],
  ['normalizeSAMInput', 'normalizeStoryInput'],
  ['normalizeSAMAssociations', 'normalizeStoryAssociations'],
  ['resolveJourneyForSam', 'resolveJourneyForStory'],
  ['planStoryCreateHeuristic', 'planStoryCreateHeuristic'],
  // wire + mount
  ['focalPcmId', 'focalCharacterId'],
  ['samEpisodeId', 'episodeId'],
  ['pcmId', 'characterId'],
  ['MountPcmBodyV1', 'MountCharacterBodyV1'],
  ['MountSamBodyV1', 'MountStoryBodyV1'],
  ['MountJsmBodyV1', 'MountSituationsBodyV1'],
  // main types last
  ['\bPCM\b', 'Character'],
  ['\bSAM\b', 'Story'],
  ['\bJSM\b', 'Situations'],
  // fix class names we over-replaced
  ['CharacterDocumentClass', 'CharacterDocument'],
  ['StoryDocumentClass', 'StoryDocument'],
  // package doc strings
  ['twinfile-character/pcm', 'twinfile-character/persona'],
  ['twinfile-character/jsm', 'twinfile-character/situations'],
  ['twinfile-story/sam', 'twinfile-story/narrative'],
  ['./pcm', './persona'],
  ['./jsm', './situations'],
  ['./sam', './narrative'],
  ['/types/pcm.js', '/types/character.js'],
  ['/schemas/pcm.schema.js', '/schemas/character.schema.js'],
  ['/types/sam.js', '/types/story-narrative.js'],
  ['/schemas/sam.schema.js', '/schemas/story-narrative.schema.js'],
  [' sam.yml', ' story-narrative.yml'],
  [' pcm.yml', ' character.yml'],
  ["'pcm':", "'character':"],
  ['"pcm":', '"character":'],
  ["'sam':", "'story':"],
  ['"sam":', '"story":'],
  ["'jsm':", "'situations':"],
  ['"jsm":', '"situations":'],
  [' mount pcm', ' mount character'],
  ['CharacterTwinfileSpec', 'CharacterTwinfileSpec'],
];

const EXT = new Set(['.ts', '.tsx', '.md', '.json', '.yml', '.yaml', '.mjs']);

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    if (name === 'node_modules' || name === 'dist' || name === '.git') continue;
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (EXT.has(path.extname(name)) && !name.endsWith('.d.ts.map')) out.push(p);
  }
  return out;
}

function renameFiles(base) {
  const files = walk(base);
  for (const [from, to] of FILE_RENAMES) {
    for (const file of files) {
      if (path.basename(file) === from) {
        const dest = path.join(path.dirname(file), to);
        if (!fs.existsSync(dest)) {
          fs.renameSync(file, dest);
        }
      }
    }
  }
}

function applyText(file) {
  let text = fs.readFileSync(file, 'utf8');
  let next = text;
  for (const [from, to] of TEXT_REPLACEMENTS) {
    if (from.startsWith('\\b')) {
      next = next.replace(new RegExp(from, 'g'), to);
    } else {
      next = next.split(from).join(to);
    }
  }
  if (next !== text) fs.writeFileSync(file, next);
}

function renameTestDirs(base) {
  const moves = [
    [path.join(base, 'catalog/character/test/pcm'), path.join(base, 'catalog/character/test/persona')],
    [path.join(base, 'catalog/character/test/jsm'), path.join(base, 'catalog/character/test/situations')],
    [path.join(base, 'catalog/story/test/sam'), path.join(base, 'catalog/story/test/narrative')],
  ];
  for (const [from, to] of moves) {
    if (fs.existsSync(from) && !fs.existsSync(to)) fs.renameSync(from, to);
  }
  const yamlSam = path.join(base, 'catalog/story/test/example/commute-run/sam.yml');
  const yamlStory = path.join(base, 'catalog/story/test/example/commute-run/story-narrative.yml');
  if (fs.existsSync(yamlSam) && !fs.existsSync(yamlStory)) fs.renameSync(yamlSam, yamlStory);
}

function patchPackageJson() {
  const charPkg = path.join(ROOT, 'catalog/character/package.json');
  const storyPkg = path.join(ROOT, 'catalog/story/package.json');
  if (fs.existsSync(charPkg)) {
    let t = fs.readFileSync(charPkg, 'utf8');
    t = t
      .replaceAll('".\/pcm"', '".\/persona"')
      .replaceAll('".\/pcm/', '".\/persona/')
      .replaceAll('".\/jsm"', '".\/situations"')
      .replaceAll('".\/jsm/', '".\/situations/');
    fs.writeFileSync(charPkg, t);
  }
  if (fs.existsSync(storyPkg)) {
    let t = fs.readFileSync(storyPkg, 'utf8');
    t = t
      .replaceAll('".\/sam"', '".\/narrative"')
      .replaceAll('".\/sam/', '".\/narrative/');
    fs.writeFileSync(storyPkg, t);
  }
}

patchPackageJson();
renameTestDirs(ROOT);
for (const base of TARGETS) renameFiles(base);
for (const base of TARGETS) {
  for (const file of walk(base)) applyText(file);
}

console.log('drop-pcm-sam-jsm: done');