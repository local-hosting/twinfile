# Private GitHub Packages (`@twinfile/*`)

Repos in the **twinfile** org are **private**. npm artifacts publish to **GitHub Packages** with **`access: restricted`** (org-only), not the public npm registry.

## Local development

Use a sibling checkout (no registry auth required):

```text
twinfile/
  spec/
  core/      → package.json: "@doppler-group/twinfile-spec": "file:../spec"
  examples/
```

Run `yarn install` and `yarn check` from each repo (or from the monorepo root with workspaces).

## CI in `core` and `examples`

Workflows check out **`twinfile/spec`** as a sibling directory (`../spec`) so `file:../spec` works without registry auth. The **spec** repo must allow org-wide workflow access:

```bash
gh api -X PUT repos/twinfile/spec/actions/permissions/access \
  --input '{"access_level":"organization"}'
```

Optional: install **`@doppler-group/twinfile-spec`** from GitHub Packages in other projects (see below). Cross-repo **Actions** installs need package → repository access in package settings if you use the registry in CI instead of checkout.

## Publishing

- **spec**: Actions → **publish** workflow (`workflow_dispatch` or tag `v*`).
- **core**: run **publish** after `@doppler-group/twinfile-spec` is on the registry; pins `1.0.0-draft.1` in the published manifest.

Install as a org member:

```ini
@twinfile:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=<GITHUB_TOKEN or PAT with read:packages>
```

```bash
yarn add @doppler-group/twinfile-spec@1.0.0-draft.1
```
