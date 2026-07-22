# DSP and Audio Quality

## Real-time pipeline

The default vocal processing path is:

```text
Microphone
→ browser capture constraints
→ AudioWorklet
→ DC removal
→ high-pass filtering
→ calibrated adaptive gate
→ pitch detector
→ confidence filter
→ note mapping
```

OpenVox requests echo cancellation, browser noise suppression and automatic gain control to be disabled where the browser honors these constraints. This is intentional: aggressive conferencing DSP can distort sustained harmonic material used for pitch analysis.

## Calibration

The silence calibration collects approximately three seconds of input-level samples, estimates a high noise percentile and derives an adaptive noise floor. The result is sent to the AudioWorklet and retained in the current project settings.

## Processing profiles

- `Raw`: minimal gating for controlled recording environments.
- `Vocal`: balanced filtering for ordinary singing practice.
- `Noisy`: stronger rejection of low-level background input.
- `Custom`: exposes the adjustable gate multiplier.

## Pitch engines

The primary engine is a small WebAssembly normalized-autocorrelation detector. A TypeScript YIN implementation is retained as a fallback.

The valid frequency range is currently optimized for approximately 55–1400 Hz. Confidence thresholds are used to reject unstable or non-periodic frames.

## Known hard problem: simultaneous voices

A single microphone receives a mixture, not isolated singers. Identifying several fundamental frequencies is possible, but reliably separating individual singers, lyrics and timing from a dense choir mixture is a different problem. The current harmony view is therefore experimental rather than presented as guaranteed source separation.
