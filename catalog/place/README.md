# @doppler-group/twinfile-place

Twin type package — layout: [`packages/spec/doc/type-package-layout.md`](../../packages/spec/doc/type-package-layout.md).

- `src/twin-module.ts` — `<unit>.twin.yaml` module
- `src/place/` — compose, copy, mounts, `PlaceType`, event bindings
- `src/build/` — `buildTwinfile`, scenario compose, `TwinfileBuilder`
- `src/check/` — archetype layout checks, strict place load
- `src/mounts/` — place layout wire (`placeRef`-keyed) for host lockers
- `src/types/` — mount wire types

Generic twin load, lock, pack, and refs stay in `@doppler-group/twinfile-core` (with deprecated re-exports for one release).