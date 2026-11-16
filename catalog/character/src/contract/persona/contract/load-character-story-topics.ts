import { statSync } from 'node:fs';
import { join } from 'node:path';

import { loadEntityDir, loadTopicFolder, readYamlFile, resolveCharacterSubdir, STORY_DIR_CANDIDATES } from './io.js';
import { CHARACTER_STORY_TOPIC_MAP } from './topic-maps.js';

export function loadCharacterStoryTopics(root: string): {
  journeys: unknown[];
  quotes: unknown[];
  quoteTaxonomy?: unknown;
} {
  const rootJourneysDir = join(root, 'journeys');
  const rootQuotesDir = join(root, 'quotes');
  const hasRootJourneys = statSync(rootJourneysDir, { throwIfNoEntry: false })?.isDirectory();
  const hasRootQuotes = statSync(rootQuotesDir, { throwIfNoEntry: false })?.isDirectory();

  if (hasRootJourneys || hasRootQuotes) {
    const quoteTaxonomyPath = join(root, 'quote-taxonomy.yml');
    const legacyTaxonomyPath = join(root, 'taxonomy.yml');
    const taxonomyPath = statSync(quoteTaxonomyPath, { throwIfNoEntry: false })?.isFile()
      ? quoteTaxonomyPath
      : legacyTaxonomyPath;
    return {
      journeys: hasRootJourneys ? loadEntityDir(rootJourneysDir) : [],
      quotes: hasRootQuotes ? loadEntityDir(rootQuotesDir) : [],
      ...(statSync(taxonomyPath, { throwIfNoEntry: false })?.isFile()
        ? { quoteTaxonomy: readYamlFile(taxonomyPath) }
        : {}),
    };
  }

  const storyDir = resolveCharacterSubdir(root, STORY_DIR_CANDIDATES);
  const storySlice = loadTopicFolder(storyDir, CHARACTER_STORY_TOPIC_MAP);
  const taxonomyPath = join(storyDir, 'taxonomy.yml');
  const journeys = storySlice.journeys;
  const quotes = storySlice.quotes;
  return {
    journeys: Array.isArray(journeys) ? journeys : [],
    quotes: Array.isArray(quotes) ? quotes : [],
    ...(statSync(taxonomyPath, { throwIfNoEntry: false })?.isFile()
      ? { quoteTaxonomy: readYamlFile(taxonomyPath) }
      : {}),
  };
}
