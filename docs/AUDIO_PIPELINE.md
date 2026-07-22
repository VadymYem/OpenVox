# Audio pipeline

## Goals

The audio architecture prioritizes low latency, predictable failure modes and local processing.

## Microphone acquisition

OpenVox requests microphone access only when an audio feature starts. Constraints can include:

- selected `deviceId`;
- requested sample rate;
- mono/stereo channel count;
- echo cancellation;
- browser noise suppression;
- automatic gain control.

Browsers may treat constraints as requests rather than guarantees. The actual stream/audio-context behavior therefore remains browser and hardware dependent.

## Conditioning

The core live analyzer uses lightweight conditioning before pitch detection:

1. DC/mean removal;
2. high-pass filtering;
3. adaptive noise-floor gating;
4. level/RMS tracking;
5. confidence-based pitch acceptance.

Professional Audio Lab exposes a larger user-adjustable graph including high-pass, low-pass, notch, gate, compressor and gain stages.

## Pitch detection

The primary pitch detector is a WebAssembly module compiled from auditable C source. It uses a difference-function and cumulative mean normalized-difference approach in the YIN family.

A TypeScript fallback is retained for compatibility.

The application rejects results outside the configured frequency range or below the configured confidence threshold.

## Calibration

Room calibration estimates the quiet background noise level. Voice-level calibration helps users identify excessively quiet or clipping-prone input conditions.

Calibration improves gating but cannot remove arbitrary competing voices or strongly overlapping pitched instruments.

## Pitch scoring

Most practice scoring uses absolute cents distance from a target pitch. A sample is counted as a hit when it falls inside the configured exercise tolerance. Summary accuracy metrics are intentionally simple and interpretable rather than presented as a scientific clinical score.

## Offline audio analysis

Imported files are decoded with `decodeAudioData` where supported. Analysis can calculate waveform peaks and spectral statistics locally. Browser codec support determines which compressed formats can be decoded.

## Multitrack rendering

Playback sources are scheduled against a shared AudioContext clock. Offline export rebuilds the audible graph in an OfflineAudioContext and encodes the result as 16-bit PCM WAV.

## Performance considerations

- larger FFT sizes improve frequency resolution but increase CPU and latency;
- mobile devices may benefit from smaller analyzer settings;
- microphone enhancements provided by the operating system or browser can alter measured pitch/level behavior;
- Bluetooth audio can add substantial latency and is not ideal for tight real-time monitoring;
- headphones are recommended when microphone scoring runs alongside synthesized accompaniment.
