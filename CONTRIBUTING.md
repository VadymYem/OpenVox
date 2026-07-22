# Contributing

Contributions are welcome when they preserve OpenVox Studio's local-first architecture, accessibility and testability.

## Development setup

```bash
npm ci
npm run dev
```

Before opening a pull request:

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
OPENVOX_BASE=/OpenVox/ OPENVOX_PUBLIC_URL=https://vadymyem.github.io/OpenVox npm run build
OPENVOX_BASE=/OpenVox/ OPENVOX_PUBLIC_URL=https://vadymyem.github.io/OpenVox npm run verify
```

## Pull-request expectations

A change should:

- solve one clearly described problem;
- preserve local processing unless a network dependency is explicitly justified and documented;
- avoid introducing mandatory accounts or server infrastructure for core functionality;
- include tests for deterministic logic;
- include accessible labels and keyboard interaction for new controls;
- update all three supported interface languages when user-facing copy is added;
- update relevant documentation and the changelog for significant changes;
- avoid committing `node_modules`, local build output or source maps.

## Audio and DSP changes

For pitch, DSP or timing changes, include:

- the signal assumptions;
- sample-rate behavior;
- expected latency/CPU tradeoffs;
- reproducible reference inputs when possible;
- before/after measurements rather than only subjective descriptions.

Do not silently change thresholds that affect scoring without documenting why.

## Music-file changes

MusicXML and MIDI fixes should include a reduced test fixture or programmatically constructed case that reproduces the issue.

## Accessibility

New routes are expected to be added to the route-wide accessibility test. Automated checks are not a replacement for keyboard and screen-reader testing, but serious/critical automated regressions are not accepted.

## Code style

The project uses TypeScript, ESLint and Prettier. Keep modules focused and prefer named domain functions over large page-level utility blocks when logic is reusable.
