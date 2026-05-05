# RFC 0001 — five layers of meaning

Status: Accepted (bootstrap 1.0.0-draft.1)
Created: 2026-11-04

## Summary

Twinfile 1.0 defines four **unit kinds** (`place`, `event`, `situation`, `scenario`) and place-local **plans**, composed in a fixed **layer order** like Docker images.

## Motivation

Older single-file venue layouts conflate static geometry with operational scenarios. Twinfile separates what is at a place, what is scheduled or unplanned, how the place responds, and what question a run answers.

## Specification

- Manifest field `twinfile: 1`; IDs `^[a-z0-9][a-z0-9-]{0,62}$`.
- **Layer order:** **place** → each included event (event layers + plan role layer) → each situation → scenario patches → resolved args.
- **Merge:** RFC 7396 on objects; arrays of `{ id }` merge by id; other arrays replace.
- **Contract errors:** `E_NO_PLAN`, `E_ROLE_MISSING`, `E_ROLE_KIND`, `E_ROLE_REF`, `E_ROLE_MIN`, `E_TIMETABLE_REF`.
- **Digests:** layer content SHA-256 (JCS), chain digest, `Place.digest` over `{ meta, place, layer chains }`.

Normative prose: `doc/kinds/`, `doc/place/`, `doc/build/`. Schemas: `schemas/1/twinfile/`, `schemas/1/place/`, `schemas/1/run/`.

## Conformance

Vectors under `conf/` categories `schema`, `merge`, `layer`, `contract`, `digest`. Implementations MUST pass all vectors for the pinned spec version.

## Drawbacks

Bootstrap draft; not all MUST statements yet have vectors (`check-index` will grow).

## Alternatives

Single “venue document” (rejected — no cacheable layers or OCI units).
