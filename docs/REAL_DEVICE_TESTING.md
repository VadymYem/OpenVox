# Real-device testing checklist

Use this checklist after the GitHub Pages workflow has deployed the current `main` branch.

## Navigation and installation

- Open the published GitHub Pages URL in a private browser window.
- Confirm the landing page renders without console errors.
- Open `studio/`, `practice/`, `transcribe/`, `analyze/`, `score/` and `choir/` directly in new tabs.
- Confirm the PWA install prompt is available where supported.
- Install the PWA and verify that reopening it returns to the correct repository base path.

## Microphone

Test with at least one built-in microphone and one external microphone when available.

- Grant microphone permission.
- Confirm the selected device label is shown after permission is granted.
- Confirm input level responds to speech and singing.
- Run environment calibration in silence.
- Run voice-level calibration with a sustained comfortable note.
- Confirm pitch, note, cents and confidence update continuously.
- Switch processing presets and verify the signal remains stable.
- Stop and restart the audio engine several times.

## Pitch reference checks

Test sustained notes near:

- 110 Hz
- 220 Hz
- 261.63 Hz
- 440 Hz
- 880 Hz

Compare OpenVox with a trusted reference tuner and record systematic deviations.

## Practice Studio

- Start a scale exercise.
- Confirm the target note changes at the expected tempo.
- Sing intentionally sharp and flat notes and verify cents direction.
- Complete an exercise and inspect accuracy and hit-rate results.
- Test automatic transposition.
- Export and import an exercise file.

## Transcription

- Record a short monophonic melody.
- Test free timing and each quantization mode.
- Confirm the first detected note starts near zero on the transcription timeline.
- Send the result to the Score Editor.
- Import a local audio file and repeat the test.

## Score Editor

- Add, copy, split, merge and delete notes.
- Change pitch, duration, lyrics and ties.
- Export MusicXML, MIDI, SVG and PNG.
- Use the print flow and verify page scaling.
- Re-import exported MusicXML and compare musical structure.

## Choir Studio

- Import a multi-part MusicXML file.
- Switch among available parts.
- Adjust part, ensemble, piano and metronome levels.
- Start **Practice My Part** and sing against the target.
- Confirm target note, cents deviation and final accuracy are plausible.

## Pro Audio Lab

- Open Pro Audio Lab and select the microphone.
- Test high-pass, low-pass, notch, gate and compressor controls.
- Confirm spectrum, oscilloscope and spectrogram update.
- Test the metronome, reference tone, drone and keyboard.
- Record the processed signal and play the downloaded file.
- Analyze a local audio file with several FFT sizes and window functions.
- Export and re-import Pro Audio Lab settings.

## Local storage

- Save a project.
- Reload the page and confirm the current project is restored.
- Save a recording and replay it from Projects.
- Export a `.openvox` project, clear local data and import the project again.

## Browser matrix

Record browser version, operating system, device and microphone for each result.

- Chrome desktop
- Edge desktop
- Firefox desktop
- Safari macOS
- Chrome Android
- Safari iPhone/iPad

Report failures with the exact browser version and console error text.
