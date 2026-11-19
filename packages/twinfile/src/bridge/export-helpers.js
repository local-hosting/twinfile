export function asExportRecord(value, where) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        throw new Error(`${where}: expected an object`);
    }
    return value;
}
export function extRecord(row) {
    const ext = row.ext;
    if (!ext || typeof ext !== 'object' || Array.isArray(ext))
        return {};
    return ext;
}
