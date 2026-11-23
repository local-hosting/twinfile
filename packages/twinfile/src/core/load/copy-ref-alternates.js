/** Unit-layout `parts/` ↔ legacy `buildings/` (RFC 0009). Used when validating local `copy:` refs. */
export function copyRefAlternates(ref) {
    const alts = [];
    const pairs = [
        ['/parts/', '/buildings/'],
        ['./parts/', './buildings/'],
        ['../parts/', '../buildings/'],
    ];
    for (const [from, to] of pairs) {
        if (ref.includes(from))
            alts.push(ref.replaceAll(from, to));
        if (ref.includes(to))
            alts.push(ref.replaceAll(to, from));
    }
    return [...new Set(alts.filter((a) => a !== ref))];
}
