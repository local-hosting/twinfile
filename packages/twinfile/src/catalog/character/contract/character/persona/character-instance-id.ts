const MAX_SLUG_LENGTH = 80;

export function slugifyCharacterToken(value: string): string {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) {
    return '';
  }
  return trimmed
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Build a project-local persona instance id slug from display name + segment/customer type. */
export function buildCharacterIdSlug(input: {
  name: string;
  customerTypeSlug: string;
}): string {
  const namePart = slugifyCharacterToken(input.name);
  const typePart = slugifyCharacterToken(input.customerTypeSlug);
  const parts = [namePart, typePart].filter(Boolean);
  const slug = parts.join('-');
  if (!slug) {
    return 'persona';
  }
  if (slug.length <= MAX_SLUG_LENGTH) {
    return slug;
  }
  return slug.slice(0, MAX_SLUG_LENGTH).replace(/-+$/g, '');
}

export function allocateUniqueCharacterId(
  baseSlug: string,
  isTaken: (characterId: string) => boolean,
): string {
  const base = baseSlug.trim() || 'persona';
  if (!isTaken(base)) {
    return base;
  }
  for (let index = 2; index < 10_000; index += 1) {
    const candidate = `${base}-${index}`;
    if (!isTaken(candidate)) {
      return candidate;
    }
  }
  throw new Error(`Could not allocate a unique persona id for "${base}"`);
}
