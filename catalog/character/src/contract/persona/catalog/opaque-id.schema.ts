import { customAlphabet, urlAlphabet } from 'nanoid';
import { z } from 'zod';

/** Default nanoid length for catalog entity ids. */
export const CATALOG_ID_SIZE = 12;

/** URL-safe nanoid alphabet shipped with the installed nanoid version. */
export const CATALOG_ID_ALPHABET = urlAlphabet;

/** Generate a new catalog entity id. */
export const createCatalogId = customAlphabet(CATALOG_ID_ALPHABET, CATALOG_ID_SIZE);

/** True when `value` is a valid catalog entity id. */
export function isCatalogId(value: string): boolean {
  if (value.length !== CATALOG_ID_SIZE) return false;
  for (const char of value) {
    if (!CATALOG_ID_ALPHABET.includes(char)) return false;
  }
  return true;
}

/** Non-sequential opaque catalog entity id (nanoid). */
export const OpaqueCatalogIdSchema = z.string().refine(isCatalogId, {
  message: `Expected a ${CATALOG_ID_SIZE}-character nanoid catalog id`,
});