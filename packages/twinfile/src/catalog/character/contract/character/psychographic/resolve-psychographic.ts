import { MbtiTypeIdSchema } from '../myers-briggs/myers-briggs.schema.js';
import {
  findMbtiTypeDefinition,
  getDefaultMyersBriggsCatalog,
} from '../myers-briggs/myers-briggs.js';
import type { MyersBriggsCatalog } from '../myers-briggs/myers-briggs.schema.js';
import {
  PsychographicAspectRefSchema,
  PsychographicSchema,
  type Psychographic,
  type PsychographicAspectRef,
} from './legacy-resolved.schema.js';

export function parsePsychographicAspectRef(input: unknown): PsychographicAspectRef {
  return PsychographicAspectRefSchema.parse(input);
}

export function parsePsychographic(input: unknown): Psychographic {
  return PsychographicSchema.parse(input);
}

/** Resolve a declared aspect ref to a Myers-Briggs profile (other frameworks: extend here). */
export function resolvePsychographic(
  ref: PsychographicAspectRef,
  catalog: MyersBriggsCatalog = getDefaultMyersBriggsCatalog(),
): Psychographic | undefined {
  if (ref.frameworkId !== 'myers_briggs') return undefined;

  const parsedTypeId = MbtiTypeIdSchema.safeParse(ref.typeId);
  if (!parsedTypeId.success) return undefined;

  const type = findMbtiTypeDefinition(catalog, parsedTypeId.data);
  if (!type) return undefined;

  return PsychographicSchema.parse({
    frameworkId: ref.frameworkId,
    typeId: type.id,
    label: type.label,
    nickname: type.label,
    dimensions: type.dimensions,
  });
}
