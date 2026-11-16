# @local-hosting/twinfile-place

Twin type package — layout: [`packages/spec/doc/type-package-layout.md`](../../packages/spec/doc/type-package-layout.md).

- `src/twin-module.ts` — `Place.yaml` module
- `src/place/` — compose, copy, mounts, `PlaceType`, situation bindings
- `src/build/` — `buildTwinfile`, scenario compose, `TwinfileBuilder`
- `src/check/` — archetype layout checks, strict place load
- `src/mounts/` — venue layout mount wire for host lockers
- `src/types/` — mount wire types

Generic twin load, lock, pack, and refs stay in `@local-hosting/twinfile-core` (with deprecated re-exports for one release).