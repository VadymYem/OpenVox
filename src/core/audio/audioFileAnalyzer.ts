import type { PitchFrame } from '../../types';
import { frequencyToNote } from '../music/notes';
import { detectPitchYin } from './pitchDetector';
import { WasmPitchDetector } from './wasmPitch';

export interface AudioFileAnalysisOptions {
  referenceA4?: number;
  onProgress?: (progress: number) => void;
  minimumConfidence?: number;
}

function mixToMono(buffer: AudioBuffer): Float32Array {
  const channels = buffer.numberOfChannels;
  const length = buffer.length;
  const mono = new Float32Array(length);
  for (let channel = 0; channel < channels; channel++) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < length; i++) mono[i] += data[i] / channels;
  }
  return mono;
}

function rmsOf(frame: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < frame.length; i++) sum += frame[i] * frame[i];
  return Math.sqrt(sum / frame.length);
}

/** Analyze an uploaded audio file entirely in the browser. */
export async function analyzeAudioFile(file: File, options: AudioFileAnalysisOptions = {}): Promise<PitchFrame[]> {
  const referenceA4 = options.referenceA4 ?? 440;
  const minimumConfidence = options.minimumConfidence ?? 0.58;
  const context = new AudioContext();
  try {
    const decoded = await context.decodeAudioData(await file.arrayBuffer());
    const mono = mixToMono(decoded);
    const sampleRate = decoded.sampleRate;
    const frameSize = sampleRate >= 32000 ? 4096 : 2048;
    const hopSize = Math.floor(frameSize / 2);
    const wasm = new WasmPitchDetector();
    const wasmReady = await wasm.load().catch(() => false);
    const frames: PitchFrame[] = [];
    const total = Math.max(1, Math.floor((mono.length - frameSize) / hopSize));

    for (let index = 0, offset = 0; offset + frameSize <= mono.length; index++, offset += hopSize) {
      const slice = mono.subarray(offset, offset + frameSize);
      const rms = rmsOf(slice);
      if (rms >= 0.0025) {
        const detected = wasmReady ? wasm.detect(slice, sampleRate) : detectPitchYin(slice, sampleRate);
        if (detected && detected.confidence >= minimumConfidence) {
          const note = frequencyToNote(detected.frequency, referenceA4);
          frames.push({
            timestamp: offset / sampleRate,
            frequency: detected.frequency,
            midi: note.midi,
            note: note.note,
            octave: note.octave,
            cents: note.cents,
            confidence: detected.confidence,
            rms
          });
        }
      }
      if (index % 24 === 0) {
        options.onProgress?.(Math.min(1, index / total));
        await new Promise<void>((resolve) => setTimeout(resolve, 0));
      }
    }
    options.onProgress?.(1);
    return frames;
  } finally {
    await context.close();
  }
}
