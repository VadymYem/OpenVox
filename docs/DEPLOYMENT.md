# Deployment

## GitHub Pages target

The default public repository is expected to be:

```text
https://github.com/vadymyem/OpenVox
```

The corresponding project Pages URL is expected to be:

```text
https://vadymyem.github.io/OpenVox/
```

## Automatic deployment

`.github/workflows/pages.yml` deploys every successful push to `main`.

The workflow derives the base path from `GITHUB_REPOSITORY`:

```text
repository OpenVox -> OPENVOX_BASE=/OpenVox/
repository vadymyem.github.io -> OPENVOX_BASE=/
```

It also derives the public URL used by the static SEO postbuild step.

## Manual equivalent

```bash
npm ci
OPENVOX_BASE=/OpenVox/ \
OPENVOX_PUBLIC_URL=https://vadymyem.github.io/OpenVox \
npm run build

OPENVOX_BASE=/OpenVox/ \
OPENVOX_PUBLIC_URL=https://vadymyem.github.io/OpenVox \
npm run verify
```

Publish the resulting `dist/` directory as the static site root.

## Why route directories are generated

GitHub Pages is static hosting. The postbuild step writes route-specific files such as:

```text
dist/studio/index.html
dist/academy/index.html
dist/mixer/index.html
dist/score/index.html
```

This allows direct navigation and refreshes without requiring a server rewrite rule and also gives each public route its own static SEO metadata.

## PWA

The PWA manifest uses the same dynamic base path. The production build precaches application files including WASM and Professional Audio Lab resources.

## Custom domain

A custom domain can use the same source. Set `OPENVOX_BASE=/` and `OPENVOX_PUBLIC_URL` to the final HTTPS origin during the build, then configure the domain in GitHub Pages.

## Cache safety

Vite-hashed application assets can be cached aggressively. Stable-name WASM/worklet files should be revalidated rather than treated as immutable when deploying through a custom caching layer, because their URL does not necessarily change every release.
