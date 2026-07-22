# Roadmap

OpenVox Studio `1.0.0-alpha.1` is feature-rich enough for broad public testing. The remaining roadmap prioritizes measured reliability rather than adding arbitrary interface surface.

## Before 1.0

- run the complete real-device matrix on Chrome, Edge, Firefox, Safari, Android Chrome and iOS Safari;
- collect measured pitch-latency and CPU data across representative hardware;
- tune DSP defaults for built-in laptop microphones, phone microphones and common USB audio interfaces;
- expand regression fixtures for MusicXML and MIDI files from multiple notation applications;
- add browser-level end-to-end tests where microphone-independent flows can be automated reliably;
- validate PWA installation and offline updates on desktop and mobile;
- complete external review of English, Ukrainian and German interface copy;
- document benchmark methodology and publish reproducible results.

## 1.x directions

- richer score engraving, tuplets, beams and multi-voice editing;
- more curriculum packs and teacher-authored exercise collections;
- optional import/export of reusable vocal-training plans;
- non-destructive clip trimming and fades in the multitrack workspace;
- optional local effect chains per mixer track;
- more instrument families and temperament/reference tools;
- improved offline transcription segmentation and rhythm inference;
- richer choir rehearsal navigation by measures and rehearsal marks.

## Research-grade directions

These are intentionally not presented as finished production features:

- robust browser-side polyphonic pitch tracking;
- multi-singer source separation from a single mixed microphone signal;
- advanced accompaniment-following and score alignment;
- high-quality offline time stretching independent of browser media-element behavior.

Research features will only be promoted to stable functionality when they can be validated with reproducible tests and documented limitations.
