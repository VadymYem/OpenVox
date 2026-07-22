# Architecture

## Design goals

OpenVox Studio is built around five constraints:

1. core singing and audio workflows must not require an application backend;
2. microphone audio should remain on the user's device in the normal processing path;
3. expensive real-time work must avoid blocking the interface when practical;
4. modules should degrade through feature detection rather than failing the whole application;
5. deployment must work from a GitHub Pages project subpath.

## Application layers

```text
React interface and routing
        |
        +-- Vocal training / score / project domain logic
        |
        +-- AudioEngine ------------------------------------+
        |       |                                           |
        |       +-- MediaDevices constraints                |
        |       +-- AudioWorklet primary processor          |
        |       +-- ScriptProcessor compatibility fallback  |
        |       +-- WASM pitch detector                     |
        |       +-- TypeScript YIN fallback                 |
        |       +-- harmony and file-analysis modules       |
        |
        +-- Music domain -----------------------------------+
        |       +-- notation model
        |       +-- MusicXML
        |       +-- MIDI
        |       +-- SVG score renderer
        |       +-- local tone playback
        |
        +-- Local storage ----------------------------------+
                +-- projects
                +-- recordings
                +-- settings
                +-- training sessions
                +-- practice goals
```

## Real-time audio path

The primary microphone path is created only after a user action grants microphone access.

```text
MediaStreamAudioSourceNode
  -> AudioWorklet processor
      -> DC removal
      -> high-pass conditioning
      -> noise-floor-aware gate
      -> RMS/frame messages
  -> application pitch pipeline
      -> WASM YIN-family detector
      -> TypeScript fallback detector
      -> configurable frequency/confidence filtering
      -> note/cents conversion
```

The worklet path is preferred in secure contexts. A ScriptProcessor fallback keeps basic analysis available where AudioWorklet cannot be created.

## WebAssembly

The DSP source is committed as:

```text
packages/dsp/openvox_dsp.c
```

The compiled artifact is:

```text
public/wasm/openvox_dsp.wasm
```

The build script recompiles it with Clang when available. If Clang is unavailable, it validates and uses the committed WASM file. This makes the source auditable without making routine development depend on a system compiler.

## Professional Audio Lab

The advanced audio lab is kept as an independently mounted runtime in `public/pro-lab/`. This isolates its large audio graph and visualization code from the main React state while keeping it part of the same static deployment.

The DSP table helper generates and caches window/twiddle data lazily instead of shipping multi-megabyte repeated numeric literals in the source repository.

## Storage

IndexedDB is the durable local store. Schema upgrades are versioned. Export/import functions provide portability because browser site data is not a permanent backup mechanism.

## Music data

The score model is an internal normalized event representation. Importers translate MusicXML/MIDI to that model; exporters generate open formats from it. The visual score renderer is an SVG renderer optimized for browser editing and preview rather than full publishing-grade engraving.

## Multitrack audio

Multitrack playback uses a shared AudioContext scheduling time so independently decoded AudioBuffers start on one clock. Per-track gain/pan nodes remain adjustable during playback. OfflineAudioContext is used for deterministic local mix rendering and the resulting AudioBuffer is encoded to PCM WAV.

## Routing and static SEO

React Router handles client navigation. After the Vite build, `scripts/postbuild.mjs` creates a static `index.html` for each public route. This provides direct-route loading and route-specific canonical/title/description metadata on static hosting.

A `404.html` copy is also emitted as a recovery path.

## GitHub Pages base path

Vite receives `OPENVOX_BASE` at build time. The Pages workflow derives it from `GITHUB_REPOSITORY`, so:

```text
vadymyem/OpenVox -> /OpenVox/
vadymyem/vadymyem.github.io -> /
```

The same base is applied to bundled assets, PWA start/scope paths, WASM, AudioWorklet and Professional Audio Lab resources.

## Network boundaries

Core audio processing has no OpenVox API dependency.

The expected optional network activity is:

- GitHub Pages static asset delivery;
- Google Analytics page telemetry in the standard web build, unless disabled by the user;
- browser-vendor speech recognition when the user explicitly enables voice commands and the browser implementation uses a remote service;
- external support/source links opened by the user.
