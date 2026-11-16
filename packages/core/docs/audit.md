# Plane repo audit (0.1)

Mapping of legacy `@twinfile/*` plane repos to **@doppler-group/twinfile-core** for post-0.1 slimming. Status: draft for human review.

| Repo | Keep in plane | Port to core | Drop / defer |
| --- | --- | --- | --- |
| **spec** | Normative schemas, conf vectors, docs | — | — |
| **core** | Reference impl (load, build, lock, OCI pack, CLI) | — | — |
| **examples** | Example units | — | — |
| **pcm** | Policy content | Contract role patterns | Duplicate merge |
| **jsm** | Journey content | Timetable/phase hooks (later) | Duplicate manifest check |
| **sam** | Scenario content | Scenario patch layering (Phase 2+) | Duplicate bundle build |
| **ipm** | Instrumentation packs | DTPR envelope helpers (later) | Closed-host coupling |
| **axm** | Authoring UX | CLI formatting only (now in core `twin`) | Closed-host init |

**Rule:** No closed-host imports in `@doppler-group/twinfile-core` (`scripts/check-open-standard.mjs`, `packages/tooling/scripts/check-vendor-neutral.mjs`).

**Next slimming step:** After 0.1 npm release, point plane CLIs at `npx @doppler-group/twinfile-core` / `twin` and delete duplicated validate+merge code per row above.

**Host mounts:** Implemented in host apps and external experience-plane packages, not in the open stack.
