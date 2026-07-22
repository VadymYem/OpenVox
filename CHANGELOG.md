# Changelog


## 1.0.0-alpha.4

- Fixed system-theme handling in test and non-browser environments where `window.matchMedia` is unavailable.
- Fixed the Google Analytics bootstrap regression test to read the repository HTML template through a stable filesystem path.
- Restored the full application and accessibility test suites after the theme bootstrap regression.

## 1.0.0-alpha.3

### Fixed

- Hardened GitHub Pages deployment against accidentally publishing the raw Vite source tree.
- Removed `%BASE_URL%` placeholders from source HTML asset references and rely on Vite URL rebasing during production builds.
- Added a source-deployment diagnostic screen instead of a blank page when GitHub Pages is misconfigured to publish the repository branch directly.
- Added production verification that rejects raw `/src/main.tsx` entries and incorrect manifest/icon base paths.
- Updated the Pages workflow checkout action and added an explicit raw-source artifact gate.
- Added dedicated GitHub Pages troubleshooting documentation.


All notable project changes are recorded here.

## 1.0.0-alpha.1 — 2026-07-22

### Added

- automatic first-run interface language detection from the browser language preference list: Ukrainian → Ukrainian, German → German, English → English, all unsupported languages (including Russian) → English;
- system-theme synchronization for the browser theme-color metadata while retaining explicit light and dark overrides;
- score-rendering regression coverage for treble-staff reference notes, accidental spelling and inconsistent stored pitch metadata;
- static verification that the production HTML includes the AuthorChe Google Analytics measurement tag `G-6LN7QL6SP2`.

### Changed

- enabled the same Google Analytics bootstrap used on the AuthorChe web properties while retaining OpenVox SPA page-view events and a Settings opt-out;
- promoted the project to the `1.0.0-alpha.1` milestone after the notation, localization, theme and analytics audit.

### Fixed

- incorrect vertical score placement caused by using E4 instead of B4 as the middle line of the treble staff;
- incorrect staff placement of flat-spelled notes caused by deriving diatonic position from MIDI pitch class alone;
- stale or inconsistent note labels in score previews by reconciling stored note spelling with canonical MIDI pitch;
- note-label editor fields not refreshing after transposition, undo or redo;
- duplicate accessibility attribute on the score time-signature selector;
- duplicate Google tag loading when the static analytics bootstrap is already present.

## 0.9.1-beta.1 — 2026-07-21

### Added

- Resume Builder-style project support flow with a floating donate button, accessible support dialog, “Maybe later” action and voluntary prompt cadence after meaningful exports;
- public AuthorChe profile card on the landing and About pages with logo, website and résumé links;
- dismissible mobile experience notice recommending desktop use for the most demanding studio workflows;
- reusable score viewport with fit-to-width rendering and 70–180% zoom controls across Score, Choir and Sight Singing;
- mobile Score Editor workspace switch between editing and score preview;
- dedicated mobile experience documentation;
- automated support-flow and mobile score UI tests.

### Changed

- replaced the basic single-oscillator score/practice playback with layered local synthesis profiles for piano, vocal exercises, choir playback and precision reference tones;
- improved score-note editing on small screens with touch-friendly cards and full-width actions;
- reduced Pro Audio Lab mobile icon, header, tab, keyboard and canvas proportions;
- added explicit SVG sizing for Pro Audio Lab action icons to prevent oversized intrinsic SVG rendering;
- moved the desktop Pro Audio Lab launcher above the project-support button and hides the redundant launcher on mobile;
- expanded footer navigation with About and résumé links;
- improved mobile notation behavior across all score-rendering surfaces.

### Fixed

- overlapping fixed support and Pro Audio Lab launch buttons;
- oversized Pro Audio Lab button icons on narrow screens;
- desktop-first score preview sizing that forced unnecessarily wide 720 px notation canvases on phones;
- cramped mobile note editor rows;
- flat and harsh synthesized playback caused by a single oscillator with no shared filtering, dynamics or ambience.

## 0.9.0-beta.1 — 2026-07-20

### Added

- complete Vocal Academy with session planner, pitch matching, breathing, ear, rhythm and sight-singing trainers;
- 27 structured vocal exercises with English, Ukrainian and German descriptions and instructions;
- 12-topic localized Vocal Guide;
- Instrument Workshop with chromatic tuning, more than 20 tuning presets, custom tunings, transposition, reference tones and MIDI monitoring;
- local Progress system with training sessions and weekly goals;
- Backing Track Lab with waveform navigation, speed control, pitch-preserving playback where supported, A–B loops, markers and live pitch monitoring;
- local Multitrack Mixer with imported tracks, microphone overdubs, gain, pan, mute, solo, offsets, looping and offline WAV mixdown;
- Choir passage rehearsal with selected time range, 50–150% tempo and repeated loops synchronized with live pitch scoring;
- expanded Professional Audio Lab with tone-shaping EQ, algorithmic reverb, feedback delay and final safety limiter;
- light, dark and system themes plus reduced-motion, high-contrast and large-control preferences;
- responsive navigation and mobile layouts;
- skip navigation and route-focus management;
- GitHub Pages deployment for a repository named `OpenVox` with dynamic base-path resolution;
- CodeQL, Dependabot and dependency-review automation;
- automated accessibility checks across every public route;
- Score Editor undo/redo, whole-score transposition and mass rhythmic quantization;
- WAV encoder tests and expanded instrument/training tests;
- CycloneDX SBOM generation with a CI freshness check;
- comprehensive architecture, capability, compatibility, privacy, accessibility, validation and manual-QA documentation.

### Changed

- audio preferences now affect actual microphone constraints and pitch filtering;
- AudioWorklet processing has a compatibility fallback;
- runtime SEO uses the real deployment origin and Vite base path;
- optional Google Analytics is disabled by default and requires explicit opt-in;
- PWA generation uses a repository-owned service worker instead of a Workbox dependency chain;
- production bundling separates application code from framework and MIDI dependencies;
- project version advanced from public alpha to beta.

### Fixed

- stale GitHub repository and Pages paths;
- inactive audio preference controls;
- multiple accessibility issues discovered by route-wide automated audits;
- score and MusicXML handling for more complex multi-voice input;
- local project and recording persistence issues from early builds;
- deployment path assumptions inherited from the earlier Cloudflare-specific build.

## [1.0.0-alpha.3] - 2026-07-22

### Fixed

- Removed unnecessary escaped quotation marks from the theme-color meta selector in `AppContext.tsx`, allowing the strict ESLint `no-useless-escape` gate to pass.

