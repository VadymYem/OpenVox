# Privacy

OpenVox Studio is designed as a local-first browser application.

## Core audio processing

Microphone frames used by the live studio, vocal training, tuner and analysis tools are processed through browser audio APIs and the local pitch-analysis pipeline. The application does not require an OpenVox server endpoint for audio processing.

## Local storage

OpenVox may store the following in the browser's IndexedDB or local settings storage:

- projects and scores;
- explicitly saved recordings;
- application and audio preferences;
- training sessions;
- practice goals;
- locally created instrument tunings and audio-lab presets.

The user can export project or audio files to the device. Clearing site data in the browser can remove locally stored information that has not been exported.

## Imported files

Audio, MusicXML, MIDI and OpenVox project files are read locally by the application. They are not uploaded by the core import workflow.

## Optional analytics

The standard web deployment loads Google Analytics with measurement ID `G-6LN7QL6SP2` for aggregate page-visit measurement. Users can disable analytics in application settings. Audio frames, score content and recording blobs are not intentionally attached to analytics events by OpenVox Studio. Deployment operators are responsible for applying any consent mechanism required by the laws and policies that apply to their audience.

Users who require a deployment without analytics can disable the integration in settings or remove the analytics module/configuration in their own deployment.

## Optional browser speech recognition

Voice-command functionality is disabled by default. When explicitly enabled, it uses the browser's speech-recognition implementation. Depending on the browser and platform, speech recognition may use a remote browser-vendor service. This feature is therefore not classified as part of the guaranteed local audio-processing path.

## Browser permissions

Microphone and MIDI permissions are controlled by the browser. OpenVox requests them only when a feature needs them.

For a more detailed data-flow description, see [docs/PRIVACY_MODEL.md](docs/PRIVACY_MODEL.md).
