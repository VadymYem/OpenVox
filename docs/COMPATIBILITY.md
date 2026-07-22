# Browser and device compatibility

OpenVox Studio is a browser audio application. Capability depends on the Web APIs implemented by the browser and on device/audio-driver behavior.

## Target matrix

| Platform                  | Expected status                   | Notes                                                             |
| ------------------------- | --------------------------------- | ----------------------------------------------------------------- |
| Current Chrome desktop    | Primary target                    | Fullest Web Audio and media support                               |
| Current Edge desktop      | Primary target                    | Chromium behavior expected                                        |
| Current Chrome Android    | Primary mobile target             | Test CPU-heavy analyzer settings on device                        |
| Current Firefox desktop   | Supported                         | Some media/device behavior differs from Chromium                  |
| Current Safari macOS      | Supported with feature detection  | Audio permissions and codecs should be tested carefully           |
| Current Safari iOS/iPadOS | Supported with mobile constraints | User gestures and audio-session behavior are especially important |

## Secure context

Microphone and many advanced browser capabilities require a secure context. GitHub Pages is served over HTTPS, which satisfies this deployment requirement.

## AudioWorklet

AudioWorklet is the preferred real-time processing path. OpenVox includes a compatibility fallback for environments where the worklet cannot be created.

## MediaRecorder

Recording format support varies. OpenVox checks browser capabilities and handles unsupported recording paths without making the rest of the application unusable.

## Web MIDI

Web MIDI is optional and is not available in every browser. The Instrument Workshop remains usable as a tuner without MIDI access.

## Audio codecs

Imported MP3/AAC/Opus/WebM and other compressed formats depend on browser decoding support. WAV is the most predictable interchange format for local audio workflows.

## Mobile layout

All primary routes are responsive. Mobile-specific adaptations include:

- compact navigation with bounded vertical scrolling;
- a dismissible desktop-recommendation notice for advanced workflows;
- touch-friendly note cards and controls;
- dedicated Edit / Score switching in the Score Editor;
- reusable fit-to-width and zoomable notation viewports in Score, Choir and Sight Singing;
- horizontally scrollable command toolbars where a full command set must remain available;
- smaller Pro Audio Lab icons, header controls, canvases and reference keyboard proportions;
- a large-control accessibility preference;
- reduced analyzer workload recommendations for low-power devices.

Desktop or laptop use with wired headphones remains the recommended environment for dense notation editing, multitrack work, large analyzer settings and long Pro Audio Lab sessions. See [MOBILE_EXPERIENCE.md](MOBILE_EXPERIENCE.md).

## Known environmental factors

The following can affect measured latency or pitch behavior without being OpenVox defects:

- Bluetooth headsets;
- operating-system microphone enhancements;
- browser echo cancellation/noise suppression/automatic gain control;
- low-quality built-in microphones;
- thermal throttling;
- multiple applications competing for the audio device.

For reproducible audio testing, use wired headphones and a stable microphone whenever possible.
