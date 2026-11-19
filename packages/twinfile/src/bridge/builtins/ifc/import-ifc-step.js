import { packPlaceUnit, readImportName, twinId, unmappedExt, withImportExt, } from '../../authoring.js';
import * as WebIFC from 'web-ifc';
let apiReady;
async function getIfcApi() {
    if (!apiReady) {
        apiReady = (async () => {
            const api = new WebIFC.IfcAPI();
            await api.Init();
            return api;
        })();
    }
    return apiReady;
}
function propName(api, modelId, lineId) {
    const line = api.GetLine(modelId, lineId);
    const name = line.Name?.value ?? line.LongName?.value;
    return typeof name === 'string' && name.trim() ? name : undefined;
}
export async function importIfcStep(input) {
    const api = await getIfcApi();
    const modelId = api.OpenModel(input.ifcBytes);
    try {
        const storeys = [];
        const storeyIds = api.GetLineIDsWithType(modelId, WebIFC.IFCBUILDINGSTOREY);
        const size = storeyIds?.size?.() ?? 0;
        for (let i = 0; i < size; i += 1) {
            const lineId = storeyIds.get(i);
            const props = api.GetLine(modelId, lineId);
            const gid = String(props.GlobalId?.value ?? `storey-${lineId}`);
            const id = twinId(gid);
            const ordinal = Number(props.Elevation?.value ?? i);
            storeys.push({
                id,
                name: readImportName(props.Name, id),
                level: Number.isFinite(ordinal) ? ordinal : i,
            });
        }
        storeys.sort((a, b) => a.level - b.level);
        const storeyByLineId = new Map();
        for (let i = 0; i < size; i += 1) {
            const lineId = storeyIds.get(i);
            storeyByLineId.set(lineId, storeys[i].id);
        }
        const spaces = [];
        const spaceIds = api.GetLineIDsWithType(modelId, WebIFC.IFCSPACE);
        const spaceCount = spaceIds?.size?.() ?? 0;
        for (let i = 0; i < spaceCount; i += 1) {
            const lineId = spaceIds.get(i);
            const props = api.GetLine(modelId, lineId);
            const gid = String(props.GlobalId?.value ?? `space-${lineId}`);
            const id = twinId(gid);
            const name = propName(api, modelId, lineId) ?? id;
            const parentLine = props.Decomposes?.[0]?.value;
            const storey = parentLine !== undefined ? storeyByLineId.get(parentLine) : storeys[0]?.id;
            const ifcType = typeof props.ObjectType?.value === 'string' ? props.ObjectType.value : 'IfcSpace';
            spaces.push(withImportExt({
                id,
                kind: twinId(ifcType),
                name,
                ...(storey ? { level: storey } : {}),
            }, unmappedExt('ifc', 'spaces', { ifcType, ifc_line_id: lineId }, ['id', 'name', 'storey', 'ifcType'])));
        }
        if (spaces.length === 0)
            throw new Error('ifc: no IfcSpace entities found');
        const placeName = typeof input.name === 'string' ? input.name : 'IFC building';
        const ifcFile = typeof input.file === 'string' ? input.file : undefined;
        const levels = storeys.map((row) => withImportExt({ id: row.id, ordinal: row.level, name: row.name }, unmappedExt('ifc', 'levels', row, ['id', 'level', 'name'])));
        const archetype = levels.length > 1 ? 'indoor_stack' : 'single_level';
        const site = withImportExt({
            name: placeName,
            kind: 'building',
            timezone: 'UTC',
            published: false,
            archetype,
        }, { ...(ifcFile ? { ifc_file: ifcFile } : {}) });
        return packPlaceUnit(twinId(placeName), 'museum', [{ place: site }, { levels }, { spaces }]);
    }
    finally {
        api.CloseModel(modelId);
    }
}
export function isIfcBytesInput(input) {
    return Boolean(input && typeof input === 'object' && 'ifcBytes' in input && input.ifcBytes instanceof Uint8Array);
}
