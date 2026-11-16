# Release 0.1.0

> **Monorepo:** publish and CI for `@doppler-group/*` use [`.github/workflows/publish-doppler-group.yml`](../../../.github/workflows/publish-doppler-group.yml) and root [`ci.yml`](../../../.github/workflows/ci.yml). The sections below are **legacy split-repo** (`twinfile/core`, `twinfile/examples`) notes.

## Shipped in git

- Tag **`v0.1.0`** on [twinfile/core](https://github.com/twinfile/core) (`e1931ef` + publish fixes)
- Tag **`v1.0.0-draft.1`** on [twinfile/spec](https://github.com/twinfile/spec) (npm package already on GitHub Packages if publish returned 409)
- [CHANGELOG.md](../CHANGELOG.md) for `@doppler-group/twinfile-core@0.1.0`

## One-time CI / publish setup (org)

Workflows check out private **`twinfile/spec`** and **`twinfile/examples`**. Add a PAT to each repo:

```bash
# PAT scopes: repo, read:packages, write:packages (classic) or fine-grained equivalent
gh secret set TF_PACKAGES_TOKEN --repo twinfile/core
gh secret set TF_PACKAGES_TOKEN --repo twinfile/examples
```

Allow Actions to read the spec repo (org admin once):

```bash
gh api -X PUT repos/twinfile/spec/actions/permissions/access \
  --input '{"access_level":"organization"}'
```

## Publish `@doppler-group/twinfile-core`

After the secret is set:

```bash
gh workflow run publish --repo twinfile/core --ref main
# or push an updated tag (delete/recreate v0.1.0 only if you accept tag churn)
```

Install:

```ini
@twinfile:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=<token with read:packages>
```

```bash
npm install @doppler-group/twinfile-core@0.1.0
```

## Post-0.1 (not in this release)

Runners, MCP, viewer, plane repo slimming. Venue layout uses core **`resolvePlaceMount`** ([archived-venue-to-place](../../spec/doc/migration/venue-to-place.md)).
