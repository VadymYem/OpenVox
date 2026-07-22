# OpenVox Studio

**A privacy-first, open-source browser studio for singers, vocal teachers, choirs and musicians.**

OpenVox Studio combines real-time pitch tracking, structured vocal education, instrument tuning, backing-track rehearsal, multitrack mixing, transcription, notation, choir-part practice and professional audio tools in one local-first web application.

Core microphone and project workflows run in the browser. No account or application server is required.

## Live application

After the `main` branch is deployed with the included GitHub Pages workflow:

**https://vadymyem.github.io/OpenVox/**

## What is included

| Area                   | Capabilities                                                                                                                                                                                      |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Live Voice Studio      | microphone selection, calibration, noise-floor estimation, pitch/note/frequency/cents/confidence, harmony lens, recording                                                                         |
| Vocal Academy          | session planner, pitch matching, breath pacing, ear training, rhythm training, sight singing, 27-exercise library, 12-topic vocal guide                                                           |
| Practice Studio        | scales, arpeggios, intervals, sustained notes, custom melodies, automatic transposition, microphone scoring, portable teacher exercises                                                           |
| Vocal Analysis         | touched/stable/sustained range, pitch stability, average deviation, vibrato-rate and vibrato-width estimates                                                                                      |
| Instrument Workshop    | chromatic tuner, 20+ string-instrument tuning presets, custom tunings, ±12-semitone transposition, reference tones, optional Web MIDI monitor                                                     |
| Backing Track Lab      | local audio loading, waveform navigation, speed control, pitch preservation where supported, A–B loop, markers, live voice monitoring                                                             |
| Multitrack Mixer       | multiple local tracks, microphone overdubs, synchronized playback, gain, pan, mute, solo, offsets, A–B looping, local WAV mixdown                                                                 |
| Professional Audio Lab | microphone constraints, filters, custom gate, compressor, monitoring, metronome, tone/drone generators, keyboard, tuner, spectrum, oscilloscope, spectrogram, file analysis, presets, diagnostics |
| Voice to Score         | live or imported-audio monophonic transcription, tempo estimation, quantization and transfer to the score editor                                                                                  |
| Score Editor           | note timing/pitch/duration/velocity/lyrics/ties, split/merge/copy, MusicXML/MIDI import, MusicXML/MIDI/SVG/PNG/print export                                                                       |
| Choir Studio           | MusicXML/MIDI ensemble import, part isolation, rehearsal mix, passage selection, 50–150% tempo, repetitions, live part scoring                                                                    |
| Progress               | local training history, weekly goals, session statistics and category balance                                                                                                                     |
| Local Projects         | IndexedDB projects, recordings, settings, training sessions, goals and portable `.openvox` archives                                                                                               |
| Interface              | English, Ukrainian and German; dark, light and system themes; responsive desktop/tablet/mobile layouts; accessibility preferences                                                                 |

See [docs/CAPABILITIES.md](docs/CAPABILITIES.md) for the detailed functional inventory.

## Local-first architecture

The normal signal path is:

```text
Microphone
  -> MediaDevices constraints
  -> AudioContext
  -> AudioWorklet (primary) / ScriptProcessor fallback
  -> DC removal + high-pass + adaptive gate
  -> WebAssembly pitch detector (primary) / TypeScript YIN fallback
  -> note, cents, confidence, range and training logic
  -> React interface
```

Local persistence uses IndexedDB. Audio-file decoding, WAV rendering, notation conversion and score export also run in the browser.

Browser speech recognition and Google Analytics are explicitly separated from the core audio path. The standard web build loads the AuthorChe Google Analytics property for page-visit measurement and provides an analytics opt-out in Settings. See [PRIVACY.md](PRIVACY.md) and [docs/PRIVACY_MODEL.md](docs/PRIVACY_MODEL.md).

## Technology

- React + TypeScript
- Vite
- Web Audio API
- AudioWorklet with compatibility fallback
- WebAssembly DSP core written in C
- IndexedDB
- MediaRecorder
- OfflineAudioContext
- MusicXML and MIDI import/export
- Progressive Web App support
- GitHub Actions + GitHub Pages

## Repository layout

```text
.github/              GitHub Actions, issue templates and dependency automation
packages/dsp/         auditable C source for the WebAssembly pitch core
public/pro-lab/       advanced audio-lab runtime and lazy DSP tables
public/wasm/          committed WebAssembly build artifact
public/worklets/      real-time AudioWorklet processor
scripts/              WASM build, reference tests, postbuild SEO and deploy verification
src/app/              application state and routing
src/components/       shared interface components
src/core/audio/       microphone engine, pitch, harmony, file analysis and WAV rendering
src/core/export/      score/project export utilities
src/core/instruments/ instrument tuning definitions and frequency helpers
src/core/music/       notation, score rendering, MusicXML/MIDI and playback
src/core/storage/     IndexedDB persistence and portable project archives
src/core/training/    vocal curriculum, exercises and training planning
src/i18n/             complete EN/UK/DE interface and curriculum copy
src/pages/            product modules
src/styles/           responsive Material-inspired visual system
tests/                application, storage, music, DSP-adjacent and accessibility tests
docs/                 architecture, compatibility, validation and manual QA documentation
```

## Development

Requirements:

- Node.js 22 or newer
- npm
- Optional: Clang with `wasm32` support to rebuild the DSP module. A validated compiled WASM file is committed, so development remains possible when Clang is unavailable.

```bash
npm ci
npm run dev
```

Production-quality local checks:

```bash
npm run lint
npm run format:check
npm run typecheck
npm test
OPENVOX_BASE=/OpenVox/ OPENVOX_PUBLIC_URL=https://vadymyem.github.io/OpenVox npm run build
OPENVOX_BASE=/OpenVox/ OPENVOX_PUBLIC_URL=https://vadymyem.github.io/OpenVox npm run verify
```

`npm test` includes WebAssembly reference-frequency tests, core music tests, application route tests, IndexedDB tests, MusicXML tests, localization integrity, instrument tuning tests, WAV export tests, privacy defaults, theme contrast and automated accessibility checks across every public route.

## Publish on GitHub Pages

The repository is designed for the GitHub repository name **`OpenVox`**.

1. Create `vadymyem/OpenVox`.
2. Upload or push the repository contents so `package.json` is at the repository root.
3. Push to `main`.
4. In **Settings -> Pages**, select **GitHub Actions** as the source if GitHub has not already enabled it.
5. The included workflow calculates the Pages base path from the actual repository name, builds the app, verifies the output and deploys the `dist` artifact.

No manual edit of Vite's `base` is required.

Detailed instructions: [GITHUB_SETUP.md](GITHUB_SETUP.md) and [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Quality and security gates

The repository includes:

- deterministic `npm ci` installs through `package-lock.json`;
- ESLint and TypeScript checks;
- Prettier format verification;
- unit/component/integration tests;
- route-wide accessibility and contrast checks;
- public runtime JavaScript syntax checks;
- reproducible CycloneDX SBOM generation;
- automated serious/critical accessibility checks across all public routes;
- WebAssembly pitch reference tests from 110 Hz to 880 Hz;
- production-build integrity verification;
- source-map exclusion from production;
- dependency audit in CI;
- Dependabot;
- CodeQL analysis;
- dependency-review workflow for pull requests;
- no server-side secret requirement;
- no source maps in the deployed build.

See [docs/VALIDATION.md](docs/VALIDATION.md) and [SECURITY.md](SECURITY.md).

## Browser and mobile support

OpenVox is responsive across desktop, tablet and mobile layouts. Core vocal training, tuning and analysis workflows are designed to remain useful on smartphones, while advanced notation, multitrack audio, large analyzer settings, Web MIDI and complex Pro Audio Lab sessions are best experienced on a desktop or laptop with wired headphones.

The application includes a dismissible mobile notice, touch-oriented score editing, mobile Edit / Score workspace switching and reusable zoomable notation viewports for Score, Choir and Sight Singing.

Microphone features require a secure context in normal browser deployments. GitHub Pages provides HTTPS. Optional capabilities such as Web MIDI and recording formats remain browser-dependent.

See [docs/COMPATIBILITY.md](docs/COMPATIBILITY.md) and [docs/MOBILE_EXPERIENCE.md](docs/MOBILE_EXPERIENCE.md).

## Support the project

OpenVox is free and open source. A floating Support button links to `https://authorche.top/donate`. The application can also show a non-blocking support prompt after the first and every fourth meaningful file export, following the same voluntary-support pattern used by AuthorChe's Resume Builder.

Donations are optional and do not unlock features.

## About the creator

OpenVox is created by **AuthorChe (Vadym Yemelianov)** — a Ukrainian musician, vocalist, vocal teacher, web developer and open-source creator. The landing page and About page include a public author card with a link to the creator's résumé at `https://authorche.top/resume`.

## Important technical limits

OpenVox Studio is ambitious, but it does not claim impossible browser-side behavior:

- live microphone transcription is optimized for a dominant monophonic vocal line;
- simultaneous blind separation of several live singers from one microphone is not presented as production-grade source separation;
- browser audio decoding and recording formats differ by browser;
- automated pitch metrics are training aids, not medical diagnostics;
- browser speech-recognition implementations may use a browser-vendor service when explicitly enabled;
- high-latency or low-power devices may require smaller FFT settings in Professional Audio Lab.

These boundaries are documented rather than hidden.

## Privacy

The core application does not require an account, database server or audio-upload endpoint. Projects and recordings remain in the browser until the user explicitly exports a file.

The standard web build loads Google Analytics page-visit measurement by default and provides an opt-out in application settings. Analytics remains separate from every audio-processing path; audio frames, recordings and score content are not intentionally attached to analytics events.

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md). Bug reports should include browser version, operating system, device class, reproduction steps and console output when relevant.

## License

Copyright © AuthorChe (Vadym Yemelianov).

Source code is licensed under **GNU AGPL-3.0-only**. See [LICENSE](LICENSE), [NOTICE](NOTICE) and [TRADEMARKS.md](TRADEMARKS.md).

The license covers source-code rights. Project names, logos and branding are addressed separately by the trademark policy.
