/** RFC 8785-style canonical JSON string (sorted object keys, no whitespace). */
export function canonicalizeJson(value) {
    if (value === null || typeof value !== 'object') {
        return JSON.stringify(value);
    }
    if (Array.isArray(value)) {
        return `[${value.map((item) => canonicalizeJson(item)).join(',')}]`;
    }
    const obj = value;
    const keys = Object.keys(obj).sort();
    return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalizeJson(obj[k])}`).join(',')}}`;
}
function mergeIdArray(base, patch) {
    const byId = new Map();
    for (const row of base) {
        byId.set(row.id, { ...row });
    }
    const order = base.map((r) => r.id);
    for (const row of patch) {
        if (row.$delete) {
            byId.delete(row.id);
            const idx = order.indexOf(row.id);
            if (idx >= 0)
                order.splice(idx, 1);
            continue;
        }
        const prev = byId.get(row.id);
        if (prev) {
            byId.set(row.id, mergeObjects(prev, row));
        }
        else {
            byId.set(row.id, { ...row });
            order.push(row.id);
        }
    }
    return order.map((id) => byId.get(id));
}
function isIdArray(value) {
    return (Array.isArray(value) &&
        value.length > 0 &&
        value.every((row) => typeof row === 'object' && row !== null && 'id' in row));
}
function stripDeleteRows(rows) {
    return rows
        .filter((row) => !row.$delete)
        .map((row) => {
        const { $delete: _d, ...rest } = row;
        return rest;
    });
}
function isIdArrayLoose(value) {
    return (Array.isArray(value) &&
        (value.length === 0 || value.every((row) => typeof row === 'object' && row !== null && 'id' in row)));
}
/** Merge patch into target (RFC 7396 objects; id-arrays by id). `replace` overwrites each key in patch (Docker COPY). */
export function mergeObjects(target, patch, options = {}) {
    if (patch === null)
        return null;
    if (typeof patch !== 'object' || Array.isArray(patch)) {
        return patch;
    }
    if (typeof target !== 'object' || target === null || Array.isArray(target)) {
        return mergeObjects({}, patch, options);
    }
    const out = { ...target };
    const replace = options.mode === 'replace';
    for (const [key, val] of Object.entries(patch)) {
        if (replace) {
            if (val === null) {
                delete out[key];
                continue;
            }
            if (isIdArrayLoose(val)) {
                out[key] = stripDeleteRows(val);
                continue;
            }
            if (typeof val === 'object' && !Array.isArray(val)) {
                out[key] = mergeObjects({}, val, { mode: 'replace' });
                continue;
            }
            out[key] = val;
            continue;
        }
        if (val === null) {
            delete out[key];
            continue;
        }
        const cur = out[key];
        if (isIdArray(val) && isIdArray(cur)) {
            out[key] = mergeIdArray(cur, val);
        }
        else if (typeof val === 'object' && !Array.isArray(val)) {
            out[key] = mergeObjects(cur ?? {}, val);
        }
        else {
            out[key] = val;
        }
    }
    return out;
}
