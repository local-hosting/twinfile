export function ok(value) {
    return { ok: true, value };
}
export function err(errors) {
    return { ok: false, errors };
}
