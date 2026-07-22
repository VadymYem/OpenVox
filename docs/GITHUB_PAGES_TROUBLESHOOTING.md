# GitHub Pages troubleshooting

OpenVox is a Vite application and must be deployed from the generated `dist` directory.

## Required Pages setting

In the repository web interface:

1. Open **Settings**.
2. Open **Pages**.
3. Under **Build and deployment**, set **Source** to **GitHub Actions**.
4. Open **Actions** and run **Deploy OpenVox to GitHub Pages** if no deployment starts automatically.

Do not use **Deploy from a branch** for the source repository. The repository root contains TypeScript/TSX source files and Vite's source `index.html`; those files are not the production site.

## Symptoms of a wrong publishing source

If the browser console contains any of these strings, GitHub Pages is serving source files instead of the production build:

- `%BASE_URL%`
- `/src/main.tsx`
- requests to repository source files rather than `/OpenVox/assets/...`

The Pages workflow builds OpenVox with the repository-specific `/OpenVox/` base, verifies the output, uploads `dist` as a Pages artifact, and deploys that artifact.
