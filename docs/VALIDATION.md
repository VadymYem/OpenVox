# Validation and quality gates

## Automated validation

The repository's expected release pipeline runs the following categories.

### Static quality

```bash
npm run format:check
npm run lint
npm run typecheck
npm run check:public
npm run sbom
```

### DSP and domain tests

```bash
npm test
```

The suite includes:

- WASM reference-frequency tests at 110, 220, 261.63, 440 and 880 Hz;
- core music-domain tests;
- application-route rendering;
- IndexedDB storage behavior;
- MusicXML multi-voice/chord/tie cases;
- translation-key completeness for EN/UK/DE;
- training-library behavior;
- instrument tuning behavior;
- WAV header/encoding behavior;
- serious/critical accessibility scanning on every public route;
- light/dark theme contrast checks;
- privacy-default regression checks;
- choir passage transformation and multitrack WAV encoding checks.

### Production build

```bash
OPENVOX_BASE=/OpenVox/ \
OPENVOX_PUBLIC_URL=https://vadymyem.github.io/OpenVox \
npm run build

OPENVOX_BASE=/OpenVox/ \
OPENVOX_PUBLIC_URL=https://vadymyem.github.io/OpenVox \
npm run verify
```

The verifier checks:

- every expected static route;
- canonical URL generation;
- GitHub Pages base path in the application bundle;
- PWA scope and start URL;
- WASM and AudioWorklet assets;
- Professional Audio Lab assets;
- social/PWA icons;
- sitemap generation;
- source-map exclusion;
- minimum WASM artifact size.

## Dependency controls

- deterministic npm lockfile;
- committed CycloneDX SBOM with a CI regeneration/diff gate;
- CI production dependency audit;
- Dependabot;
- dependency review for pull requests;
- CodeQL.

## Manual validation

Audio correctness cannot be fully validated in jsdom. Real microphones, mobile browser audio sessions, permissions, codecs and device latency require the separate manual plan in [MANUAL_TEST_PLAN.md](MANUAL_TEST_PLAN.md).

## Release philosophy

A green automated pipeline means deterministic software checks passed. It does not justify claiming unmeasured acoustic accuracy or universal browser behavior. Those claims require documented real-device measurements.

## Current beta validation baseline

For `1.0.0-alpha.1`, the validation surface adds regression coverage for system-language detection, the static Google Analytics bootstrap and treble-staff pitch placement. Exact aggregate test counts and build results should always be confirmed by the CI run attached to the commit being released.
