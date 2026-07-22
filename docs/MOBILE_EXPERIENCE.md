# Mobile experience

OpenVox is responsive and the primary training workflows are designed to remain usable on current smartphones and tablets. Mobile browsers and devices nevertheless have tighter audio, memory, screen-space and API constraints than desktop systems.

## What is optimized for mobile

- Live Voice Studio and pitch monitoring
- Vocal Academy training flows
- Practice Studio exercises
- Instrument tuning and reference tones
- Vocal analysis
- Progress history
- Local projects and settings
- Backing-track rehearsal
- Score viewing with fit-to-width and zoom controls
- Score editing through a dedicated Edit / Score workspace switch
- Choir and sight-singing score viewing through the same responsive score viewport
- Touch-friendly note cards and action controls
- Compact Pro Audio Lab controls and visualizers

## Desktop recommendation

For the most stable full-studio workflow, a desktop or laptop with wired headphones is recommended for:

- dense score editing;
- large MusicXML or MIDI projects;
- multitrack mixing;
- long backing-track sessions;
- high-resolution FFT and spectrogram analysis;
- Professional Audio Lab routing and processed recording;
- Web MIDI workflows;
- workflows that require several panels to remain visible at once.

OpenVox displays a dismissible mobile notice explaining this recommendation. The notice does not block mobile use.

## Browser-dependent capabilities

Some browser APIs have platform-dependent support or behavior:

- microphone access and AudioWorklet require a secure context in normal web deployments;
- MediaRecorder codecs and containers differ by browser;
- Web MIDI is optional and unavailable in some major browsers;
- audio latency and output routing depend on the operating system and device;
- mobile browsers may suspend or reconfigure audio when the page is backgrounded;
- low-power devices may require smaller FFT sizes.

OpenVox uses feature detection and fallback paths where practical rather than claiming identical behavior on every device.

## Recommended mobile setup

- Use the installed PWA or HTTPS deployment rather than opening local files directly.
- Use wired headphones when practising with microphone monitoring or backing tracks.
- Close other audio-heavy applications when testing latency-sensitive workflows.
- Start with moderate analyzer settings before increasing FFT size.
- Keep important projects backed up using `.openvox` export.
