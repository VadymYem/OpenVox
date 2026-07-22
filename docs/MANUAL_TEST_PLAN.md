# Manual release test plan

Run this plan on the deployed GitHub Pages build before promoting a beta to 1.0.

## Test matrix

At minimum:

- Chrome on Windows or macOS;
- Edge on Windows;
- Firefox desktop;
- Safari macOS;
- Chrome Android;
- Safari iPhone or iPad.

Where possible, test both a built-in microphone and a USB audio interface.

## 1. Installation and routing

- open the root Pages URL;
- refresh each major direct route;
- navigate using desktop and mobile navigation;
- install the PWA where offered;
- relaunch the installed PWA;
- disconnect network after one complete load and verify cached application-shell behavior;
- update to a new build and verify the PWA updates without stale WASM/worklet assets.

## 2. Permissions

- deny microphone permission and verify a recoverable error;
- grant permission and start Studio;
- change microphone device;
- revoke permission in browser settings and verify recovery;
- test optional MIDI permission on a supported browser.

## 3. Live pitch

With a reference instrument or generated tone:

- test A2, A3, A4 and A5 where the microphone supports the range;
- record reported Hz and cents;
- test a chromatic sequence;
- test quiet and loud input;
- calibrate a quiet room;
- repeat with browser EC/NS/AGC on and off;
- verify no frozen UI after repeated start/stop cycles.

## 4. Vocal Academy and Practice

- complete pitch matching;
- complete a breathing cycle;
- complete ear and rhythm sessions;
- run a sight-singing session;
- generate a planned session;
- run a transposing Practice Studio exercise with headphones;
- confirm sessions appear in Progress;
- confirm scoring remains synchronized at different tempos.

## 5. Instrument Workshop

- compare chromatic tuner against a known reference;
- test guitar standard and alternate tunings;
- apply ±12-semitone transposition;
- create and reload a custom tuning;
- play reference tones;
- connect a MIDI keyboard where supported.

## 6. Backing Track Lab

- load WAV and at least one compressed format supported by the browser;
- seek and use ±5-second controls;
- test 0.5x, 1.0x and 1.5x speed;
- test pitch preservation;
- create an A–B loop;
- add markers;
- start live voice monitoring while the track plays.

## 7. Multitrack Mixer

- import at least three tracks;
- test different offsets;
- adjust gain and pan during playback;
- test mute and solo combinations;
- set an A–B loop;
- record a microphone overdub;
- export WAV;
- open the exported WAV in a separate player and check length/channels/audibility.

## 8. Transcription and Score

- transcribe a simple major scale;
- import an audio melody;
- test each quantization mode;
- edit pitch, timing, lyrics and ties;
- split and merge notes;
- import MusicXML containing multiple voices/chords;
- import MIDI;
- export MusicXML and reopen it in another notation application;
- export MIDI and inspect playback;
- export SVG and PNG;
- print to PDF.

## 9. Choir

- import a multipart MusicXML file;
- switch parts;
- adjust all rehearsal mix sliders;
- select a short passage;
- test 50%, 100% and 150% tempo;
- repeat the passage multiple times;
- practice the part with a microphone and verify target timing follows the modified tempo;
- test the same flow with MIDI ensemble input.

## 10. Persistence and portability

- create multiple projects;
- save recordings;
- reload the browser;
- export an `.openvox` archive;
- clear site data;
- reimport the archive;
- verify project score and recordings are restored where included.

## 11. Themes, localization and mobile

- test EN/UK/DE on every major route;
- test dark/light/system theme;
- test reduced motion;
- test high contrast;
- test large controls;
- test portrait and landscape phone layouts;
- check 200% browser zoom.

## 12. Accessibility

- complete all main navigation using keyboard only;
- check skip link;
- verify focus after route changes;
- operate dialogs and file controls;
- run a screen reader through Studio, Academy, Instruments, Mixer and Score;
- ensure live numeric pitch feedback has a textual representation.

## Report format

For every defect record:

```text
Version:
Commit:
Public URL:
Browser + version:
OS/device:
Audio device:
Route/module:
Steps:
Expected:
Actual:
Console output:
Reproducibility:
```
