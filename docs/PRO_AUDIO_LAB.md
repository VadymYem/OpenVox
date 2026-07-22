# Pro Audio Lab

The Pro Audio Lab is an advanced local audio workspace included with OpenVox Studio.

## Signal chain

```text
Microphone
  → pre gain
  → high-pass filter
  → low-pass filter
  → notch filter
  → low-shelf / presence / air EQ
  → noise gate
  → compressor
  → post gain
  → parallel algorithmic reverb / feedback delay
  → safety limiter
  → analyzer
  → processed recorder / monitor
```

## Tools

- Configurable microphone constraints
- Noise gate with threshold, attack, release, hold and closed level
- Dynamics compression
- Three-stage tone shaping with low-shelf, parametric presence and air shelf controls
- Algorithmic convolution reverb and feedback delay with independent wet levels
- Final safety limiter before monitoring and processed recording
- High-pass, low-pass and notch filtering
- Live spectrum analyzer
- Oscilloscope
- Spectrogram
- Precision tuner
- Metronome with subdivision and swing
- Reference tone generator
- Drone and chord generator
- Reference keyboard
- Processed recording
- Local audio-file analysis
- Presets and JSON settings import/export
- Browser diagnostics

## DSP tables

The GitHub source distribution does not store multi-megabyte precomputed numeric arrays. Window functions and FFT twiddle tables are generated lazily and cached by FFT size.

Supported analysis windows:

- Hann
- Hamming
- Blackman
- Blackman-Harris
- Flat-top

Supported FFT sizes:

- 1024
- 2048
- 4096
- 8192
- 16384
- 32768
