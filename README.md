<div align="center">

# OpenVox

### Privacy-first open-source vocal training, music practice, audio analysis, notation, and recording studio — directly in your browser.

**Created by AuthorChe (Vadym Yemelianov)**

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](LICENSE)
[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Ready-222222?logo=github)](https://vadymyem.github.io/OpenVox/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?logo=typescript\&logoColor=white)](https://www.typescriptlang.org/)
[![PWA](https://img.shields.io/badge/PWA-Offline%20Ready-5A0FC8)](#progressive-web-app)
[![Privacy](https://img.shields.io/badge/Privacy-Local--First-c8a96e)](#privacy)

[Live Demo](https://vadymyem.github.io/OpenVox/) · [Report Bug](https://github.com/vadymyem/OpenVox/issues) · [Request Feature](https://github.com/vadymyem/OpenVox/issues) · [Security](SECURITY.md)

</div>

---

## What is OpenVox?

**OpenVox** is a free and open-source browser-based studio for singers, vocal teachers, musicians, choirs, students, and anyone who wants to understand and train their voice or work with sound.

The project combines:

* real-time pitch detection;
* vocal training;
* singing exercises;
* sight-singing practice;
* vocal range analysis;
* intonation and stability measurement;
* instrument tuning;
* ear and rhythm training;
* backing-track practice;
* multitrack audio work;
* score editing;
* MusicXML and MIDI workflows;
* choir rehearsal tools;
* professional audio processing;
* recording;
* local project storage.

The core philosophy is simple:

> **Your voice should not need to leave your device to be analyzed.**

Most OpenVox functionality runs locally inside the browser using modern Web APIs, WebAssembly, AudioWorklet, and local browser storage.

No account is required for the core workflow.

---

# Features

## Live Voice Studio

The main vocal monitoring environment provides real-time analysis of microphone input.

OpenVox can display:

* detected note;
* frequency in hertz;
* cents deviation;
* pitch confidence;
* input level;
* pitch history;
* live voice visualization;
* note stability;
* microphone state.

The audio pipeline supports:

* microphone selection;
* sample-rate preferences;
* mono and stereo input preferences;
* latency preferences;
* browser noise suppression;
* browser echo cancellation;
* automatic gain control;
* high-pass filtering;
* adaptive noise handling;
* configurable pitch range;
* configurable confidence threshold.

The main processing pipeline is designed around:

```text
Microphone
    ↓
Web Audio API
    ↓
AudioWorklet
    ↓
Signal processing
    ↓
WebAssembly pitch analysis
    ↓
Pitch validation
    ↓
Musical note detection
    ↓
Live visualization
```

A compatibility fallback is available when AudioWorklet cannot be used.

---

# Vocal Academy

OpenVox includes a dedicated learning environment for structured vocal development.

The Vocal Academy contains tools for:

* warm-up planning;
* pitch matching;
* breathing practice;
* sustained notes;
* scales;
* arpeggios;
* agility;
* resonance;
* articulation;
* dynamics;
* ear training;
* rhythm training;
* sight singing;
* cooldown exercises.

The exercise library contains structured exercises across multiple categories and difficulty levels.

Each exercise may include:

* musical pattern;
* tempo;
* repetitions;
* direction;
* transposition behavior;
* training instructions;
* focus points;
* estimated duration.

The interface is available in:

* English;
* Ukrainian;
* German.

---

## Vocal Guide

OpenVox also includes educational material covering important areas of vocal practice:

* posture and body alignment;
* breath management;
* vocal onset;
* resonance;
* vocal registers;
* register transitions;
* vowels;
* articulation;
* intonation;
* audiation;
* rhythm;
* dynamics;
* vibrato observation;
* healthy practice structure.

OpenVox is an educational tool and does not replace medical diagnosis or treatment.

Persistent pain, sudden voice loss, or recurring vocal problems should be evaluated by a qualified medical professional.

---

# Sight Singing

The sight-singing trainer creates a visual musical exercise and compares the singer's live pitch against the expected notes.

It can evaluate:

* correct pitch;
* cents deviation;
* timing;
* note transitions;
* overall pitch accuracy.

Completed sessions can be saved to the local progress history.

---

# Practice Studio

Practice Studio provides configurable vocal exercises.

Available exercise types include:

* scales;
* arpeggios;
* intervals;
* sustained notes;
* custom melodies.

Controls include:

* tempo;
* repetitions;
* ascending direction;
* descending direction;
* automatic semitone transposition;
* starting note;
* ending range;
* live microphone evaluation.

OpenVox can compare the detected voice against the currently expected note and calculate an approximate training score.

---

# Teacher Mode

Teachers can prepare portable exercises without requiring student accounts or a dedicated backend.

Exercise configurations can be exported and shared.

This makes it possible to create workflows such as:

```text
Teacher creates exercise
        ↓
Exercise is shared
        ↓
Student opens OpenVox
        ↓
Student practices locally
```

The architecture is intentionally designed so that basic exercise sharing does not require centralized user storage.

---

# Instrument Workshop

OpenVox includes a dedicated environment for tuning musical instruments.

Supported tuning presets include configurations for:

### Guitar

* Standard;
* Half Step Down;
* Drop D;
* Drop C;
* DADGAD;
* Open D;
* Open E;
* Open G;
* 7-string guitar.

### Bass

* 4-string standard;
* 5-string standard;
* 6-string standard;
* Drop D.

### Ukulele

* High G;
* Low G;
* Baritone;
* D tuning.

### Strings

* Violin;
* Viola;
* Cello;
* Double Bass.

### Other

* Mandolin;
* Banjo;
* Tenor Banjo;
* Chromatic tuning.

Custom tunings can also be created.

Additional controls include:

* reference A4 frequency;
* semitone transposition;
* live target-note comparison;
* cents deviation;
* reference tone playback.

Where supported by the browser, OpenVox can also inspect connected MIDI devices.

---

# Backing Track Lab

Backing Track Lab is designed for rehearsal with local audio files.

Features include:

* local audio loading;
* waveform visualization;
* playback position control;
* playback speed control;
* pitch-preserving playback where supported;
* A–B loop;
* rehearsal markers;
* repeated difficult sections;
* simultaneous live microphone monitoring;
* rehearsal-session tracking.

All imported audio remains local unless the user explicitly exports or shares it.

---

# Multitrack Mixer

OpenVox includes a local browser-based multitrack environment.

Features include:

* multiple audio tracks;
* synchronized playback;
* per-track gain;
* stereo panning;
* mute;
* solo;
* track position offsets;
* shared timeline;
* waveform lanes;
* master gain;
* A–B loop.

## Overdub recording

A microphone performance can be recorded while existing tracks are playing and then added as another synchronized track.

## Offline mixdown

Projects can be rendered locally using `OfflineAudioContext`.

OpenVox can export a local PCM WAV mixdown without requiring server-side audio rendering.

---

# Pro Audio Lab

Pro Audio Lab provides more detailed control over the browser audio signal chain.

The processing rack can include:

```text
Input
  ↓
Pre Gain
  ↓
High-pass Filter
  ↓
Low-pass Filter
  ↓
Notch Filter
  ↓
Low Shelf EQ
  ↓
Parametric Presence EQ
  ↓
High Shelf / Air EQ
  ↓
Noise Gate
  ↓
Compressor
  ↓
Post Gain
  ↓
Reverb / Delay
  ↓
Safety Limiter
  ↓
Analyzer
  ↓
Monitoring / Recording
```

Available controls include:

### Filters

* high-pass frequency;
* low-pass frequency;
* notch frequency;
* filter Q.

### Equalization

* low shelf frequency and gain;
* presence frequency;
* presence Q;
* presence gain;
* air frequency;
* air gain.

### Noise Gate

* threshold;
* attack;
* hold;
* release;
* closed level.

### Compressor

* threshold;
* knee;
* ratio;
* attack;
* release.

### Reverb

* wet level;
* decay duration;
* decay shape.

The impulse response is generated locally.

### Delay

* delay time;
* feedback;
* wet level.

### Limiter

* output ceiling;
* release behavior.

Processed recording uses the configured processing chain.

---

# Audio Tools

OpenVox includes additional musical and audio utilities.

## Metronome

Configurable options include:

* 20–300 BPM;
* time-signature beat count;
* subdivisions;
* swing;
* accented first beat.

## Tone Generator

Supported waveforms include:

* sine;
* triangle;
* sawtooth;
* square.

Controls include:

* frequency;
* fine tuning;
* level.

## Drone and Chord Generator

Users can create sustained reference sounds from configurable interval structures.

Examples:

```text
0, 7, 12
0, 4, 7
0, 3, 7
0, 4, 7, 11
```

## Reference Keyboard

A browser-based musical keyboard provides locally generated reference notes.

---

# Precision Tuner

The precision tuner displays:

* detected note;
* exact frequency;
* cents deviation;
* confidence;
* tuning direction.

The reference frequency for A4 can be adjusted.

---

# Spectrum Analysis

OpenVox includes visualization tools for inspecting audio signals.

Available views include:

* frequency spectrum;
* oscilloscope;
* spectrogram.

Supported FFT sizes include:

* 1024;
* 2048;
* 4096;
* 8192;
* 16384;
* 32768.

Window functions include:

* Hann;
* Hamming;
* Blackman;
* Blackman-Harris;
* Flat-top.

Window tables and FFT helper data are generated and cached only when required.

---

# Offline Audio Analyzer

Local audio files can be analyzed directly in the browser.

Available measurements include:

* duration;
* sample rate;
* number of channels;
* RMS level;
* peak level;
* crest factor;
* zero-crossing rate;
* spectral centroid;
* spectral rolloff;
* spectral flatness;
* dominant frequencies.

Supported audio formats depend on browser decoding capabilities.

---

# Vocal Analysis

OpenVox can analyze recorded or live singing sessions.

Metrics may include:

* lowest detected note;
* highest detected note;
* touched vocal range;
* stable vocal range;
* sustained vocal range;
* average pitch deviation;
* pitch stability;
* vibrato rate;
* vibrato width.

These measurements are intended for practice and educational feedback.

They should not be interpreted as medical measurements.

---

# Voice-to-Score Transcription

OpenVox can convert monophonic pitch information into editable musical notes.

Input sources include:

* live microphone;
* local audio files.

Quantization options include:

* free timing;
* quarter notes;
* eighth notes;
* eighth-note triplets;
* sixteenth notes.

Detected material can be transferred to the integrated Score Editor.

---

# Score Editor

OpenVox includes an integrated notation editor.

Users can edit:

* pitch;
* octave;
* MIDI note;
* note position;
* duration;
* velocity;
* lyrics;
* ties;
* tempo;
* time signature;
* key signature;
* title;
* composer.

Editing operations include:

* add;
* copy;
* delete;
* split;
* merge;
* undo;
* redo;
* global transposition;
* global quantization.

Supported imports include:

* MusicXML;
* MIDI.

Supported exports include:

* MusicXML;
* MIDI;
* SVG;
* PNG;
* print / PDF workflow;
* OpenVox project data.

The browser score renderer is designed for interactive editing and rehearsal workflows.

It is not intended to replace dedicated professional engraving applications in every advanced notation scenario.

---

# Choir Studio

Choir Studio is designed for sectional and individual rehearsal.

Supported workflows include:

* MusicXML part import;
* MIDI track import;
* voice-part selection;
* individual part playback;
* reduced-volume supporting parts;
* piano reference;
* metronome;
* score preview;
* live pitch evaluation.

## Passage Rehearsal

A selected section can be practiced independently.

Controls include:

* start position;
* end position;
* tempo from 50% to 150%;
* repeated playback;
* live pitch scoring.

This is useful for rehearsing difficult measures without repeatedly playing the entire score.

---

# Progress Tracking

OpenVox stores training history locally.

Progress tracking can include:

* completed sessions;
* session type;
* training duration;
* scores;
* weekly goals;
* category balance;
* recent activity.

The data is stored locally in the browser using IndexedDB.

No OpenVox account is required.

---

# Projects and Local Storage

OpenVox uses local browser storage for project data.

Projects can contain:

* notation;
* settings;
* session data;
* locally saved recordings;
* project metadata.

Portable OpenVox project files can be exported and imported.

Users remain responsible for creating external backups of important local projects.

Browser storage can be removed by the browser, operating system, privacy settings, or manual user action.

---

# Privacy

OpenVox is designed as a local-first application.

Core audio analysis is performed locally whenever the browser APIs required by the feature are available.

OpenVox does not require a dedicated server-side processing backend for its primary functionality.

## Analytics

Analytics are:

> **Disabled by default.**

The analytics provider is not loaded until the user explicitly enables analytics in Settings.

OpenVox does not intentionally send:

* microphone audio;
* recordings;
* imported songs;
* musical projects;
* pitch measurements;
* notation data;

as analytics information.

Read the complete privacy policy:

[PRIVACY.md](PRIVACY.md)

---

# Progressive Web App

OpenVox can be installed as a Progressive Web App on compatible browsers.

The production build includes:

* web app manifest;
* service worker;
* local application-shell caching;
* offline support for previously cached application resources.

The service worker is generated by the OpenVox build process without requiring Workbox.

Security-sensitive stable assets such as WebAssembly and AudioWorklet resources use update-aware cache behavior to reduce the risk of mixing incompatible application versions.

---

# Themes

OpenVox supports:

* System theme;
* Dark theme;
* Light theme.

Accessibility preferences include:

* high contrast;
* reduced motion;
* larger controls.

The main visual language combines Material Design 3 concepts with the OpenVox dark-cosmic and warm-gold identity.

---

# Responsive Design

OpenVox is designed for:

* desktop computers;
* laptops;
* tablets;
* smartphones.

Some complex audio and notation workflows provide the best experience on larger displays, but core functionality remains accessible on mobile layouts.

---

# Accessibility

Accessibility is treated as part of the product architecture.

OpenVox includes:

* keyboard-accessible controls;
* visible focus states;
* semantic controls;
* accessible names;
* skip-to-content navigation;
* focus management after client-side navigation;
* reduced-motion support;
* high-contrast mode;
* large-control mode.

Automated accessibility tests are executed across the main application routes.

Accessibility reports are welcome through GitHub Issues.

---

# Languages

The application interface supports:

* English;
* Ukrainian;
* German.

English is the primary project and documentation language.

---

# Technology

OpenVox is built with:

* React;
* TypeScript;
* Vite;
* Web Audio API;
* AudioWorklet;
* WebAssembly;
* IndexedDB;
* MediaRecorder;
* OfflineAudioContext;
* Web MIDI where supported;
* SVG;
* modern browser File APIs.

The primary DSP architecture intentionally remains separate from the React presentation layer where practical.

---

# Project Structure

```text
OpenVox/
├── .github/
│   ├── workflows/
│   ├── ISSUE_TEMPLATE/
│   ├── CODEOWNERS
│   └── FUNDING.yml
│
├── docs/
│
├── packages/
│   └── dsp/
│
├── public/
│   ├── icons/
│   ├── pro-lab/
│   ├── wasm/
│   └── worklets/
│
├── scripts/
│
├── src/
│   ├── app/
│   ├── components/
│   ├── core/
│   ├── hooks/
│   ├── i18n/
│   ├── pages/
│   ├── styles/
│   └── types/
│
├── tests/
│
├── LICENSE
├── README.md
├── SECURITY.md
├── PRIVACY.md
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
├── SUPPORT.md
├── ROADMAP.md
├── CHANGELOG.md
├── TRADEMARKS.md
├── THIRD_PARTY_NOTICES.md
├── sbom.cdx.json
├── package.json
└── vite.config.ts
```

---

# Local Development

## Requirements

Use a current Node.js LTS release.

Clone the repository:

```bash
git clone https://github.com/vadymyem/OpenVox.git
cd OpenVox
```

Install the exact dependency versions:

```bash
npm ci
```

Start the development server:

```bash
npm run dev
```

Create a production build:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

---

# Quality Checks

The repository includes automated checks for:

* formatting;
* ESLint;
* strict TypeScript;
* unused symbols;
* direct dependency declarations;
* JavaScript runtime syntax;
* DSP reference signals;
* music utilities;
* storage;
* MusicXML;
* localization;
* accessibility;
* theme contrast;
* privacy defaults;
* production build integrity;
* GitHub Pages paths;
* PWA resources;
* WebAssembly resources;
* AudioWorklet resources.

The project also includes automated repository security workflows where supported by GitHub.

---

# GitHub Pages Deployment

The repository includes a GitHub Actions workflow for deployment.

Create a repository named:

```text
OpenVox
```

Push the project to:

```text
https://github.com/vadymyem/OpenVox
```

Then open:

```text
Settings
→ Pages
→ Build and deployment
→ Source
→ GitHub Actions
```

The workflow automatically calculates the correct Vite base path from the repository name.

For the repository:

```text
vadymyem/OpenVox
```

the expected public URL is:

```text
https://vadymyem.github.io/OpenVox/
```

Do not manually commit the local `dist/` directory when using the included GitHub Actions deployment workflow.

---

# Browser Support

OpenVox targets current versions of modern browsers.

Recommended:

* Chromium-based browsers;
* Firefox;
* Safari.

Some capabilities differ by browser and operating system.

Examples include:

* AudioWorklet behavior;
* MediaRecorder formats;
* microphone constraints;
* Web MIDI;
* pitch-preserving playback;
* audio latency.

Compatibility fallbacks are used where practical.

For production microphone access, serve OpenVox through HTTPS or another browser-recognized secure context.

---

# Security

Please do not report security vulnerabilities through public GitHub Issues.

Read:

[SECURITY.md](SECURITY.md)

The repository includes:

* CodeQL;
* Dependabot;
* dependency review;
* continuous integration;
* dependency declaration validation;
* software bill of materials.

---

# Software Bill of Materials

A CycloneDX software bill of materials is available at:

```text
sbom.cdx.json
```

The SBOM documents the dependency graph represented by the locked project dependencies.

---

# Contributing

Contributions are welcome.

Before contributing, please read:

* [CONTRIBUTING.md](CONTRIBUTING.md)
* [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)
* [SECURITY.md](SECURITY.md)

Useful contribution areas include:

* audio DSP;
* pitch detection;
* MusicXML;
* MIDI;
* accessibility;
* mobile UX;
* localization;
* music education;
* vocal pedagogy;
* testing;
* browser compatibility;
* performance optimization.

---

# Support

For usage questions and general support, see:

[SUPPORT.md](SUPPORT.md)

For bugs and feature requests, use GitHub Issues.

---

# Roadmap

The development roadmap is available in:

[ROADMAP.md](ROADMAP.md)

The current release line remains pre-1.0 while real-device audio behavior continues to be validated across different microphones, browsers, and operating systems.

---

# License

OpenVox is licensed under:

**GNU Affero General Public License v3.0 only — AGPL-3.0-only**

See:

[LICENSE](LICENSE)

If you modify OpenVox and provide the modified program for users to interact with over a network, the AGPL includes source-code availability requirements.

Please read the complete license text before redistributing or operating modified versions.

---

# Trademark

The source code license does not automatically grant permission to represent modified versions as an official OpenVox or AuthorChe release.

See:

[TRADEMARKS.md](TRADEMARKS.md)

---

# Disclaimer

OpenVox is provided without warranty under the terms of its license.

Audio analysis results are estimates derived from digital signal processing and browser capabilities.

Results can vary depending on:

* microphone quality;
* room acoustics;
* background noise;
* browser;
* operating system;
* audio hardware;
* vocal technique.

OpenVox is an educational and creative tool and is not a medical diagnostic application.

---

# Author

**AuthorChe — Vadym Yemelianov**

Website:

`https://authorche.top`

GitHub:

`https://github.com/vadymyem`

---

<div align="center">

### OpenVox

**Your voice. Understood.**

Free. Open source. Local-first.

</div>
