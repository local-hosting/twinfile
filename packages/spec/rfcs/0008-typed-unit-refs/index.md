# RFC 0008 — typed unit refs (optional type segment)

Status: Proposed  
Created: 2026-11-10

## Summary

Extend the Twinfile ref grammar with an optional **type segment** between scope and name. **Flat refs remain valid** (`twinfile/arena:1.2.0`).

## Specification

### Short ref

```text
twinfile/<name>:<tag>                    # legacy (required to stay valid)
twinfile/<type>/<name>:<tag>             # typed (recommended)
```

`<type>` for **published twins** MUST be one of: **`place`**, **`resource`**, **`character`**, **`story`**.

Legacy typed segments **`event`**, **`event`**, **`scenario`** remain valid in **compose refs** (`copy: twinfile/event/...`) for simulator catalog modules and migrated presets; they do not denote a publishable twin kind. **`mixin`** / **`base`** map to **place** in OCI config.

`<name>` and `<tag>` rules unchanged (`defs.json#/$defs/twinId`, semver tag).

### OCI

```text
oci:ghcr.io/doppler-group/twinfile/<name>:<tag>@sha256:…
oci:ghcr.io/doppler-group/twinfile/<type>/<name>:<tag>@sha256:…
```

### Resolution

Implementations MUST accept **both** forms when resolving a unit. Kind is **never inferred from the slug alone**.

`catalog.parent` stays a **place** ref (flat or typed).

## Conformance

- JSON Schema `#/$defs/twinfileRef` accepts legacy and typed short refs.
- Golden twins publish under `place/examples/`, `resource/examples/`, etc.; scene runs under `story/examples/*/scenes/*/run.yaml`.