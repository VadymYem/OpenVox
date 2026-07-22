import type { MusicalNoteEvent } from '../../types';
import { midiToFrequency } from './notes';

export type SynthTimbre = OscillatorType | 'piano' | 'vocal' | 'choir' | 'reference';

interface PartialDefinition {
  type: OscillatorType;
  ratio: number;
  gain: number;
  detune?: number;
}

interface VoiceProfile {
  partials: PartialDefinition[];
  attack: number;
  release: number;
  sustain: number;
  filterHz: number;
  reverb: number;
  decay?: boolean;
}

const PROFILE: Record<'piano' | 'vocal' | 'choir' | 'reference', VoiceProfile> = {
  piano: {
    partials: [
      { type: 'triangle', ratio: 1, gain: 1 },
      { type: 'sine', ratio: 2, gain: 0.24 },
      { type: 'sine', ratio: 3, gain: 0.1 },
      { type: 'sine', ratio: 4, gain: 0.045 }
    ],
    attack: 0.006,
    release: 0.18,
    sustain: 0.42,
    filterHz: 7200,
    reverb: 0.11,
    decay: true
  },
  vocal: {
    partials: [
      { type: 'triangle', ratio: 1, gain: 0.82 },
      { type: 'sine', ratio: 1, gain: 0.34, detune: -4 },
      { type: 'sine', ratio: 2, gain: 0.12 },
      { type: 'sine', ratio: 3, gain: 0.055 }
    ],
    attack: 0.028,
    release: 0.22,
    sustain: 0.72,
    filterHz: 5600,
    reverb: 0.16
  },
  choir: {
    partials: [
      { type: 'triangle', ratio: 1, gain: 0.55, detune: -7 },
      { type: 'triangle', ratio: 1, gain: 0.55, detune: 7 },
      { type: 'sine', ratio: 1, gain: 0.48 },
      { type: 'sine', ratio: 2, gain: 0.09 }
    ],
    attack: 0.075,
    release: 0.34,
    sustain: 0.78,
    filterHz: 4800,
    reverb: 0.24
  },
  reference: {
    partials: [
      { type: 'sine', ratio: 1, gain: 1 },
      { type: 'sine', ratio: 2, gain: 0.055 }
    ],
    attack: 0.012,
    release: 0.12,
    sustain: 0.9,
    filterHz: 9000,
    reverb: 0.035
  }
};

export class TonePlayer {
  private context: AudioContext | null = null;
  private oscillators: OscillatorNode[] = [];
  private output: GainNode | null = null;

  async play(notes: MusicalNoteEvent[], volume = 0.32, timbre: SynthTimbre = 'vocal'): Promise<void> {
    this.stop();
    if (!notes.length) return;
    const AudioContextConstructor =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextConstructor) return;

    this.context = new AudioContextConstructor({ latencyHint: 'interactive' });
    if (this.context.state === 'suspended') await this.context.resume();

    const master = this.context.createGain();
    const compressor = this.context.createDynamicsCompressor();
    compressor.threshold.value = -10;
    compressor.knee.value = 12;
    compressor.ratio.value = 5;
    compressor.attack.value = 0.004;
    compressor.release.value = 0.12;
    master.gain.value = 0.92;
    master.connect(compressor).connect(this.context.destination);
    this.output = master;

    const isPreset = timbre === 'piano' || timbre === 'vocal' || timbre === 'choir' || timbre === 'reference';
    const profile = isPreset ? PROFILE[timbre] : this.profileForWaveform(timbre);
    const dry = this.context.createGain();
    dry.gain.value = 1;
    dry.connect(master);

    let wet: GainNode | null = null;
    if (profile.reverb > 0) {
      const convolver = this.context.createConvolver();
      convolver.buffer = this.createRoomImpulse(1.1, 2.6);
      wet = this.context.createGain();
      wet.gain.value = profile.reverb;
      convolver.connect(wet).connect(master);
      (dry as GainNode & { __reverbInput?: ConvolverNode }).__reverbInput = convolver;
    }

    const now = this.context.currentTime + 0.055;
    for (const note of notes) {
      if (note.isRest) continue;
      this.scheduleVoice(note, now, volume, profile, dry);
    }
  }

  stop(): void {
    this.oscillators.forEach((oscillator) => {
      try {
        oscillator.stop();
      } catch {
        // Oscillator may already have ended naturally.
      }
    });
    this.oscillators = [];
    this.output?.disconnect();
    this.output = null;
    if (this.context && this.context.state !== 'closed') void this.context.close();
    this.context = null;
  }

  private scheduleVoice(
    note: MusicalNoteEvent,
    baseTime: number,
    volume: number,
    profile: VoiceProfile,
    dry: GainNode
  ) {
    if (!this.context) return;
    const frequency = midiToFrequency(note.midi);
    const start = baseTime + Math.max(0, note.start);
    const duration = Math.max(0.06, note.duration);
    const release = Math.min(profile.release, Math.max(0.04, duration * 0.45));
    const end = start + duration;
    const velocity = Math.max(0.08, Math.min(1, (note.velocity || 96) / 127));
    const voiceGain = this.context.createGain();
    const filter = this.context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = Math.min(12000, Math.max(1800, profile.filterHz + (note.midi - 60) * 55));
    filter.Q.value = 0.55;

    const peak = Math.max(0.0004, (volume * velocity) / Math.sqrt(Math.max(1, profile.partials.length)));
    const attackEnd = start + Math.min(profile.attack, duration * 0.3);
    const sustainStart = Math.min(end - release, attackEnd + Math.max(0.02, duration * 0.2));
    voiceGain.gain.setValueAtTime(0.0001, start);
    voiceGain.gain.exponentialRampToValueAtTime(peak, Math.max(start + 0.003, attackEnd));
    if (profile.decay) {
      voiceGain.gain.exponentialRampToValueAtTime(
        Math.max(0.0002, peak * profile.sustain),
        Math.max(attackEnd + 0.02, sustainStart)
      );
    } else {
      voiceGain.gain.setValueAtTime(peak * profile.sustain, Math.max(attackEnd + 0.01, sustainStart));
    }
    voiceGain.gain.setValueAtTime(Math.max(0.0002, peak * profile.sustain), Math.max(start + 0.01, end - release));
    voiceGain.gain.exponentialRampToValueAtTime(0.0001, end);

    voiceGain.connect(filter).connect(dry);
    const reverbInput = (dry as GainNode & { __reverbInput?: ConvolverNode }).__reverbInput;
    if (reverbInput) filter.connect(reverbInput);

    for (const partial of profile.partials) {
      const oscillator = this.context.createOscillator();
      const partialGain = this.context.createGain();
      oscillator.type = partial.type;
      oscillator.frequency.setValueAtTime(frequency * partial.ratio, start);
      oscillator.detune.value = partial.detune || 0;
      partialGain.gain.value = partial.gain;
      oscillator.connect(partialGain).connect(voiceGain);
      oscillator.start(start);
      oscillator.stop(end + 0.035);
      this.oscillators.push(oscillator);
    }
  }

  private profileForWaveform(type: OscillatorType): VoiceProfile {
    const click = type === 'square';
    return {
      partials: [{ type, ratio: 1, gain: 1 }],
      attack: click ? 0.001 : 0.012,
      release: click ? 0.025 : 0.1,
      sustain: click ? 0.16 : 0.82,
      filterHz: click ? 5000 : 7800,
      reverb: click ? 0 : 0.04,
      decay: click
    };
  }

  private createRoomImpulse(seconds: number, decay: number): AudioBuffer {
    if (!this.context) throw new Error('Audio context is unavailable.');
    const length = Math.max(1, Math.floor(this.context.sampleRate * seconds));
    const buffer = this.context.createBuffer(2, length, this.context.sampleRate);
    for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
      const data = buffer.getChannelData(channel);
      for (let index = 0; index < length; index += 1) {
        const envelope = Math.pow(1 - index / length, decay);
        data[index] = (Math.random() * 2 - 1) * envelope * 0.45;
      }
    }
    return buffer;
  }
}
