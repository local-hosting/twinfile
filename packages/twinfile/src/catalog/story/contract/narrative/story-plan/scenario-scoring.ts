export function normalizeScenarioText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function scenarioTokenSet(value: string): Set<string> {
  const normalized = normalizeScenarioText(value);
  const tokens = normalized.split(' ').filter((token) => token.length > 1);
  return new Set(tokens);
}

export function scoreScenarioTokenOverlap(scenario: string, candidate: string): number {
  const scenarioTokens = scenarioTokenSet(scenario);
  const candidateTokens = scenarioTokenSet(candidate);
  if (candidateTokens.size === 0) return 0;
  let hits = 0;
  for (const token of candidateTokens) {
    if (scenarioTokens.has(token)) hits += 1;
  }
  return hits / candidateTokens.size;
}

const GENERIC_PLACE_TOKENS = new Set([
  'store',
  'shop',
  'dev.example',
  'retail',
  'location',
  'visit',
  'shopping',
]);

export function scoreFleetPlaceScenarioMatch(
  scenario: string,
  place: { slug: string; name?: string },
): number {
  const slugScore = scoreScenarioTokenOverlap(scenario, place.slug);
  if (slugScore > 0) {
    return slugScore;
  }
  const nameTokens = [...scenarioTokenSet(place.name ?? '')].filter(
    (token) => !GENERIC_PLACE_TOKENS.has(token),
  );
  if (nameTokens.length === 0) {
    return 0;
  }
  const scenarioTokens = scenarioTokenSet(scenario);
  let hits = 0;
  for (const token of nameTokens) {
    if (scenarioTokens.has(token)) {
      hits += 1;
    }
  }
  return hits / nameTokens.length;
}
