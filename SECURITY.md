# Security policy

## Supported version

Security fixes are applied to the current `main` branch and the newest published release line.

## Reporting a vulnerability

Please do not disclose an unpatched security vulnerability in a public issue.

Use GitHub private vulnerability reporting or a private repository security advisory for `vadymyem/OpenVox` when available. Include:

- affected version or commit;
- browser and operating system;
- reproduction steps;
- expected and observed behavior;
- impact assessment;
- a minimal proof of concept when safe to provide.

## Security model

OpenVox Studio is a static client-side application. It has no application server, account system or server-side secret store. The principal security boundaries are therefore:

- browser permissions for microphone and optional MIDI access;
- local IndexedDB and downloaded project/audio files;
- third-party JavaScript loaded by an optional analytics configuration;
- dependencies installed at build time;
- imported MusicXML, MIDI, audio and OpenVox project files.

Imported data is parsed as data, not executed as source code. Production builds do not publish source maps.

The repository uses dependency review, Dependabot, CodeQL, linting, type checking, tests and dependency auditing as automated controls.

## Out of scope

Reports about browser-vendor behavior that OpenVox cannot influence are still useful for compatibility tracking, but may not be actionable security vulnerabilities in this repository.
