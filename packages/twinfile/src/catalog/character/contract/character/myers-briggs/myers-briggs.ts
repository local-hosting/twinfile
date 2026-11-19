import {
  MbtiDimensionsSchema,
  MbtiTypeIdSchema,
  type MbtiDimensions,
  type MbtiTypeDefinition,
  type MbtiTypeId,
  type MyersBriggsCatalog,
} from './myers-briggs.schema.js';
import { loadMyersBriggsCatalog } from './load-myers-briggs-catalog.js';

export function getDefaultMyersBriggsCatalog(): MyersBriggsCatalog {
  return loadMyersBriggsCatalog();
}

export function parseMbtiTypeId(input: unknown): MbtiTypeId {
  return MbtiTypeIdSchema.parse(input);
}

export function mbtiDimensionsFromTypeId(typeId: MbtiTypeId): MbtiDimensions {
  const chars = typeId.split('');
  if (chars.length !== 4) {
    throw new Error(`Invalid Myers-Briggs type id "${typeId}"`);
  }

  return MbtiDimensionsSchema.parse({
    energy: chars[0],
    perception: chars[1],
    deciding: chars[2],
    lifestyle: chars[3],
  });
}

export function findMbtiTypeDefinition(
  catalog: MyersBriggsCatalog,
  typeId: MbtiTypeId,
): MbtiTypeDefinition | undefined {
  return catalog.types.find((row) => row.id === typeId);
}

export function resolveMbtiTypeDefinition(
  typeId: MbtiTypeId,
  catalog: MyersBriggsCatalog = getDefaultMyersBriggsCatalog(),
): MbtiTypeDefinition {
  const definition = findMbtiTypeDefinition(catalog, typeId);
  if (!definition) {
    throw new Error(`Unknown Myers-Briggs type "${typeId}"`);
  }
  return definition;
}
