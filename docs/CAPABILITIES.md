# Capability inventory

This document describes the functional surface of OpenVox Studio `1.0.0-alpha.2` and distinguishes stable local workflows from browser-dependent or experimental behavior.

## Live Voice Studio

### Input and calibration

- microphone device selection;
- requested sample rate and channel count;
- echo-cancellation, browser noise-suppression and automatic-gain-control preferences;
- latency preference;
- room noise-floor calibration;
- sustained-voice input-level calibration;
- raw, vocal-optimized, noisy-room and custom processing modes.

### Real-time analysis

- fundamental frequency;
- musical note and octave;
- cents from nearest equal-tempered pitch;
- confidence score;
- RMS input level;
- pitch-history visualization;
- dominant spectral-note inspection;
- configurable A4 reference, minimum/maximum pitch and confidence threshold.

### Recording

- local microphone recording through MediaRecorder when supported;
- local project recording library;
- playback, download and deletion;
- project export including stored recording blobs.

## Vocal Academy

- automatic session planner by target duration and difficulty;
- target-pitch matching with live microphone scoring;
- breathing cycles;
- interval ear training;
- rhythm tapping;
- generated sight-singing material with score preview and live pitch comparison;
- 27 structured exercises across warm-up, pitch, agility, breath, resonance, articulation, ear, rhythm, dynamics and cooldown;
- 12-topic vocal-practice guide;
- EN/UK/DE curriculum copy;
- local session-history integration.

The curriculum is educational and is not a substitute for medical advice or individualized clinical voice care.

## Practice Studio

- scale, arpeggio, interval and sustained-note patterns;
- custom note sequences;
- tempo and repetition control;
- ascending, descending and bidirectional modes;
- automatic semitone transposition;
- start and upper-limit controls;
- synthesized local playback;
- live microphone evaluation;
- accuracy, hit-rate and average-cents summaries;
- teacher exercise links encoded in the URL;
- portable `.openvox-exercise` files.

## Vocal Analysis

- briefly touched range;
- stable range;
- sustained range;
- lowest and highest stable notes;
- pitch-stability estimate;
- average equal-tempered pitch deviation;
- vibrato-rate estimate;
- vibrato-width estimate.

Metrics are intended as practice feedback, not diagnosis.

## Instrument Workshop

- chromatic tuner;
- configurable A4 reference;
- more than 20 built-in tuning presets;
- guitar, bass, ukulele, orchestral strings, mandolin and banjo families;
- alternate/drop/open tunings;
- custom string tunings;
- ±12-semitone tuning transposition;
- nearest-target display;
- per-string reference tone playback;
- optional Web MIDI input monitor where supported.

## Backing Track Lab

- local audio-file loading;
- media playback without upload;
- decoded waveform preview when browser decoding succeeds;
- playback speed from slow practice to faster review;
- browser pitch-preservation toggle where supported;
- volume control;
- exact seek and ±5-second navigation;
- A–B loop points;
- named practice markers;
- parallel microphone pitch monitor;
- local rehearsal-session logging.

## Multitrack Mixer

- multiple locally decoded audio tracks;
- sample-scheduled shared playback clock;
- track start offsets;
- live gain, pan, mute and solo;
- master level;
- shared playhead and waveform lanes;
- A–B rehearsal looping;
- microphone overdub recording when MediaRecorder is supported;
- offline mix rendering through OfflineAudioContext;
- 16-bit PCM WAV export;
- no upload endpoint.

The mixer is a rehearsal-oriented browser workstation, not a replacement for a full desktop DAW. Destructive editing, clip fades and plugin hosting are roadmap items.

## Professional Audio Lab

### Microphone graph

- input-device selection;
- sample-rate/channel/latency requests;
- browser EC/NS/AGC controls;
- pre-gain;
- high-pass filter;
- low-pass filter;
- notch filter;
- custom gate;
- compressor;
- post-gain;
- input monitoring;
- processed-signal recording.

### Tools

- metronome with subdivisions and swing;
- tone generator with several waveforms;
- drone/chord generator;
- reference keyboard;
- precision tuner;
- spectrum analyzer;
- oscilloscope;
- spectrogram;
- local audio-file analysis;
- factory and custom presets;
- browser capability diagnostics.

## Voice to Score

- live microphone capture;
- local audio-file analysis;
- stable-note segmentation;
- approximate tempo estimation;
- free/quarter/eighth/triplet/sixteenth quantization modes;
- transfer to editable score.

The current transcription path targets a dominant monophonic melodic line.

## Score Editor

- pitch and octave;
- note start and duration;
- velocity;
- lyric syllable/text field;
- tie state;
- add/copy/delete;
- split and merge;
- time sorting;
- title, composer, tempo, time signature and key signature metadata;
- MusicXML import/export;
- MIDI import/export;
- SVG export;
- PNG export;
- browser print/PDF workflow;
- local synthesized playback.

## Choir Studio

- MusicXML ensemble-part import;
- MIDI track/part import;
- part selection;
- independent level for selected part, other voices, piano reinforcement and metronome;
- passage start/end selection;
- 50–150% rehearsal tempo;
- 1–8 repetitions;
- synthesized rehearsal mix;
- transformed score preview;
- live microphone scoring synchronized to the selected passage and tempo;
- local practice-session logging.

Blind multi-singer source separation from a single live microphone is not claimed as a stable feature.

## Progress

- local training-session history;
- weekly goals;
- summary metrics;
- category distribution;
- sessions written by multiple training workflows.

## Projects and portability

- IndexedDB persistence;
- project and score state;
- recordings;
- settings;
- training sessions and goals;
- `.openvox` archive export/import;
- local device downloads.

## Interface and accessibility

- English, Ukrainian and German;
- dark, light and system themes;
- reduced-motion preference;
- high-contrast preference;
- large-controls preference;
- responsive desktop/tablet/mobile layout;
- keyboard focus styles;
- skip-to-content link;
- route-focus management;
- accessible labels on tested interactive controls;
- automated serious/critical accessibility checks across all public routes.
