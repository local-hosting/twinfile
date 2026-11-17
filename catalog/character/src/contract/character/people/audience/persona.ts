import { PersonaCatalogSchema, type PersonaCatalog } from '../audience/persona.schema.js';

export function parsePersonaCatalog(input: unknown): PersonaCatalog {
  return PersonaCatalogSchema.parse(input);
}

export function findPersonaProfile(
  catalog: PersonaCatalog | undefined,
  personaId: string,
): PersonaCatalog['personas'][number] | undefined {
  return catalog?.personas.find((row) => row.id === personaId);
}
