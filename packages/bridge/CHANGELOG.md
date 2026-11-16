# Changelog

## 0.1.1

- Single package: built-ins under `src/builtins/<id>/`
- GitHub Actions ci + publish workflows
- Spec fixture tests resolve via `TF_SPEC_ROOT` or sibling `spec/`

## 0.1.0

- Extract built-in importers from `@doppler-group/twinfile-core`
- `TwinBridge` contract and `resolveBridge` for `npm:` packages
- glTF geometry scaffold; `place-kit` helpers for bridge authors
- Built-in formats live under `src/builtins/<id>/` in this package
- Plugin id `ifc` with `web-ifc` STEP import
