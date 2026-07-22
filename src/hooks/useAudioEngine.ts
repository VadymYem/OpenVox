import { useEffect, useMemo, useRef, useState } from 'react';
import type { HarmonyPitch, PitchFrame, ProcessingMode } from '../types';
import { AudioEngine, type AudioEngineState } from '../core/audio/audioEngine';

export function useAudioEngine(referenceA4 = 440, processingMode: ProcessingMode = 'vocal', gateMultiplier = 1.8) {
  const [pitch, setPitch] = useState<PitchFrame | null>(null);
  const [level, setLevel] = useState(0);
  const [harmony, setHarmony] = useState<HarmonyPitch[]>([]);
  const [state, setState] = useState<AudioEngineState>({
    active: false,
    recording: false,
    sampleRate: 0,
    microphoneLabel: '',
    noiseFloor: 0.008
  });
  const [error, setError] = useState<string>('');
  const frameListeners = useRef(new Set<(frame: PitchFrame) => void>());

  const engine = useMemo(
    () =>
      new AudioEngine({
        onPitch: (frame) => {
          setPitch(frame);
          frameListeners.current.forEach((listener) => listener(frame));
        },
        onLevel: setLevel,
        onHarmony: setHarmony,
        onState: setState,
        onError: (err) => setError(err.message)
      }),
    []
  );

  useEffect(() => {
    engine.setReferenceA4(referenceA4);
    engine.setProcessing(processingMode, gateMultiplier);
  }, [engine, referenceA4, processingMode, gateMultiplier]);

  useEffect(
    () => () => {
      void engine.stop();
    },
    [engine]
  );

  return {
    engine,
    pitch,
    level,
    harmony,
    state,
    error,
    setError,
    subscribePitch(listener: (frame: PitchFrame) => void) {
      frameListeners.current.add(listener);
      return () => {
        frameListeners.current.delete(listener);
      };
    }
  };
}
