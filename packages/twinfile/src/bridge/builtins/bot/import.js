import { unmappedExt, asImportRecord, packPlaceUnit, readImportName, twinId, withImportExt, } from '../../authoring.js';
const asRecord = asImportRecord;
const readName = readImportName;
const withExt = withImportExt;
const packUnit = packPlaceUnit;
export function importPlace(input) {
    const root = asRecord(input, 'bot');
    const storeys = root.storeys;
    const botSpaces = root.spaces;
    if (!Array.isArray(storeys) || storeys.length === 0)
        throw new Error('bot: storeys[] is required');
    if (!Array.isArray(botSpaces) || botSpaces.length === 0)
        throw new Error('bot: spaces[] is required');
    const levels = storeys.map((item) => {
        const row = asRecord(item, 'bot storey');
        const id = twinId(String(row.id ?? 'storey'));
        return withExt({ id, ordinal: Number(row.level ?? row.ordinal ?? 0), name: readName(row.name, id) }, unmappedExt('bot', 'levels', row, ['id', 'level', 'ordinal', 'name', 'bot']));
    });
    const spaces = botSpaces.map((item) => {
        const row = asRecord(item, 'bot space');
        const id = twinId(String(row.id ?? 'space'));
        const level = typeof row.storey === 'string' ? twinId(row.storey) : undefined;
        return withExt({
            id,
            kind: 'space',
            name: readName(row.name, id),
            ...(level ? { level } : {}),
        }, unmappedExt('bot', 'spaces', row, ['id', 'name', 'storey', 'bot']));
    });
    const name = readName(root.name, 'BOT place');
    const archetype = levels.length > 1 ? 'indoor_stack' : 'single_level';
    return packUnit(twinId(name), 'museum', [
        {
            place: { name, kind: 'building', timezone: 'UTC', published: false, archetype },
        },
        { levels },
        { spaces },
    ]);
}
