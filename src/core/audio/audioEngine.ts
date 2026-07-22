import type { AudioPreferences, HarmonyPitch, PitchFrame, ProcessingMode } from '../../types';
import { detectPitchYin } from './pitchDetector';
import { WasmPitchDetector } from './wasmPitch';
import { detectHarmonyPeaks } from './harmonyDetector';
import { frequencyToNote } from '../music/notes';

export interface AudioEngineCallbacks {
  onPitch?: (frame: PitchFrame) => void;
  onLevel?: (rms: number) => void;
  onHarmony?: (pitches: HarmonyPitch[]) => void;
  onState?: (state: AudioEngineState) => void;
  onError?: (error: Error) => void;
}

export interface AudioEngineState {
  active: boolean;
  recording: boolean;
  sampleRate: number;
  microphoneLabel: string;
  noiseFloor: number;
}

export interface StartOptions {
  deviceId?: string;
  processingMode?: ProcessingMode;
  referenceA4?: number;
  gateMultiplier?: number;
  noiseFloor?: number;
  audioPreferences?: Partial<AudioPreferences>;
}

export class AudioEngine {
  private callbacks: AudioEngineCallbacks;
  private stream: MediaStream | null = null;
  private context: AudioContext | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private worklet: AudioWorkletNode | null = null;
  private analyser: AnalyserNode | null = null;
  private legacyProcessor: ScriptProcessorNode | null = null;
  private legacyBuffer = new Float32Array(2048);
  private legacyOffset = 0;
  private legacyPrevInput = 0;
  private legacyPrevOutput = 0;
  private legacyGateEnvelope = 1;
  private silentGain: GainNode | null = null;
  private animationFrame = 0;
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private recordingStartedAt = 0;
  private noiseFloor = 0.008;
  private processingMode: ProcessingMode = 'vocal';
  private referenceA4 = 440;
  private gateMultiplier = 1.8;
  private minPitchHz = 65;
  private maxPitchHz = 1400;
  private confidenceThreshold = 0.6;
  private startedAt = 0;
  private latestRms = 0;
  private latestInputRms = 0;
  private calibrationSamples: number[] | null = null;
  private wasmPitch = new WasmPitchDetector();

  constructor(callbacks: AudioEngineCallbacks = {}) {
    this.callbacks = callbacks;
  }

  async listInputDevices(): Promise<MediaDeviceInfo[]> {
    if (!navigator.mediaDevices?.enumerateDevices) return [];
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter((device) => device.kind === 'audioinput');
  }

  async start(options: StartOptions = {}): Promise<void> {
    await this.stop();
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('Microphone access is not supported by this browser.');

    this.processingMode = options.processingMode || 'vocal';
    this.referenceA4 = options.referenceA4 || 440;
    this.gateMultiplier = options.gateMultiplier || 1.8;
    if (typeof options.noiseFloor === 'number') this.noiseFloor = Math.max(0.0001, Math.min(0.08, options.noiseFloor));

    const supported = navigator.mediaDevices.getSupportedConstraints?.() || {};
    const prefs = options.audioPreferences || {};
    this.minPitchHz = Math.max(20, prefs.minimumPitchHz || 65);
    this.maxPitchHz = Math.max(this.minPitchHz + 1, prefs.maximumPitchHz || 1400);
    this.confidenceThreshold = Math.max(0.1, Math.min(0.99, prefs.confidenceThreshold ?? 0.6));
    const audio: MediaTrackConstraints = {
      deviceId: options.deviceId ? { exact: options.deviceId } : undefined,
      channelCount: { ideal: prefs.channelCount || 1 },
      echoCancellation: supported.echoCancellation ? Boolean(prefs.echoCancellation) : undefined,
      noiseSuppression: supported.noiseSuppression ? Boolean(prefs.noiseSuppression) : undefined,
      autoGainControl: supported.autoGainControl ? Boolean(prefs.autoGainControl) : undefined,
      sampleRate: { ideal: prefs.requestedSampleRate || 48000 },
      sampleSize: { ideal: 24 }
    };

    this.stream = await navigator.mediaDevices.getUserMedia({ audio, video: false });
    const AudioContextConstructor = window.AudioContext || (window as any).webkitAudioContext;
    this.context = new AudioContextConstructor({
      latencyHint: prefs.latencyHint || 'interactive',
      sampleRate: prefs.requestedSampleRate
    });
    if (this.context.state === 'suspended') await this.context.resume();
    await this.wasmPitch.load();

    this.source = this.context.createMediaStreamSource(this.stream);
    this.analyser = this.context.createAnalyser();
    this.analyser.fftSize = 8192;
    this.analyser.smoothingTimeConstant = 0.68;
    this.silentGain = this.context.createGain();
    this.silentGain.gain.value = 0;

    let workletReady = false;
    if (this.context.audioWorklet && typeof AudioWorkletNode !== 'undefined') {
      try {
        await this.context.audioWorklet.addModule(`${import.meta.env.BASE_URL}worklets/audio-processor.js`);
        this.worklet = new AudioWorkletNode(this.context, 'openvox-audio-processor', {
          numberOfInputs: 1,
          numberOfOutputs: 1,
          outputChannelCount: [1]
        });
        this.source.connect(this.worklet);
        this.worklet.connect(this.silentGain);
        this.worklet.port.postMessage({
          noiseFloor: this.noiseFloor,
          gateMultiplier: this.gateMultiplier,
          processingMode: this.processingMode
        });
        this.worklet.port.onmessage = (event) => this.handleWorkletMessage(event);
        workletReady = true;
      } catch (error) {
        this.callbacks.onError?.(
          new Error(
            `AudioWorklet unavailable; using compatibility processor. ${error instanceof Error ? error.message : ''}`.trim()
          )
        );
      }
    }
    if (!workletReady) this.startLegacyProcessor();

    this.source.connect(this.analyser);
    this.silentGain.connect(this.context.destination);
    this.startedAt = performance.now();
    this.startHarmonyLoop();
    this.emitState();
  }

  private startLegacyProcessor(): void {
    if (!this.context || !this.source || !this.silentGain) return;
    const processor = this.context.createScriptProcessor(1024, 1, 1);
    processor.onaudioprocess = (event) => {
      const input = event.inputBuffer.getChannelData(0);
      const output = event.outputBuffer.getChannelData(0);
      let processedEnergy = 0;
      let inputEnergy = 0;
      for (let i = 0; i < input.length; i += 1) {
        const raw = input[i];
        const highPassed = raw - this.legacyPrevInput + 0.995 * this.legacyPrevOutput;
        this.legacyPrevInput = raw;
        this.legacyPrevOutput = highPassed;
        let sample = this.processingMode === 'raw' ? raw : highPassed;
        if (this.processingMode !== 'raw') {
          const modeStrength = this.processingMode === 'noisy' ? 1.35 : this.processingMode === 'custom' ? 1 : 0.85;
          const threshold = this.noiseFloor * this.gateMultiplier * modeStrength;
          const normalized = Math.max(
            0,
            Math.min(1, (Math.abs(highPassed) - threshold * 0.35) / Math.max(threshold * 0.9, 1e-6))
          );
          const target = this.processingMode === 'noisy' ? normalized * normalized : Math.sqrt(normalized);
          const coefficient = target > this.legacyGateEnvelope ? 0.32 : 0.045;
          this.legacyGateEnvelope += (target - this.legacyGateEnvelope) * coefficient;
          sample = highPassed * this.legacyGateEnvelope;
        }
        output[i] = sample;
        processedEnergy += sample * sample;
        inputEnergy += highPassed * highPassed;
        this.legacyBuffer[this.legacyOffset++] = sample;
        if (this.legacyOffset >= this.legacyBuffer.length) {
          const frame = this.legacyBuffer.slice();
          this.legacyOffset = 0;
          this.processPitchFrame(
            frame,
            Math.sqrt(processedEnergy / Math.max(1, input.length)),
            Math.sqrt(inputEnergy / Math.max(1, input.length))
          );
          processedEnergy = 0;
          inputEnergy = 0;
        }
      }
    };
    this.legacyProcessor = processor;
    this.source.connect(processor);
    processor.connect(this.silentGain);
  }

  private processPitchFrame(frameData: Float32Array, rms: number, inputRms: number): void {
    if (!this.context) return;
    this.latestRms = rms || 0;
    this.latestInputRms = inputRms || this.latestRms;
    this.callbacks.onLevel?.(this.latestRms);
    if (this.calibrationSamples) this.calibrationSamples.push(this.latestInputRms);
    const result =
      this.wasmPitch.detect(frameData, this.context.sampleRate) || detectPitchYin(frameData, this.context.sampleRate);
    if (!result || result.confidence < this.confidenceThreshold) return;
    if (result.frequency < this.minPitchHz || result.frequency > this.maxPitchHz) return;
    const note = frequencyToNote(result.frequency, this.referenceA4);
    this.callbacks.onPitch?.({
      timestamp: (performance.now() - this.startedAt) / 1000,
      frequency: result.frequency,
      midi: note.midiFloat,
      note: note.note,
      octave: note.octave,
      cents: note.cents,
      confidence: result.confidence,
      rms: this.latestRms
    });
  }

  private handleWorkletMessage(event: MessageEvent): void {
    const data = event.data as { type?: string; frame?: Float32Array; rms?: number; inputRms?: number };
    if (data.type !== 'frame' || !data.frame) return;
    this.processPitchFrame(data.frame, data.rms || 0, data.inputRms ?? data.rms ?? 0);
  }

  private startHarmonyLoop(): void {
    if (!this.analyser || !this.context) return;
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    const tick = () => {
      if (!this.analyser || !this.context) return;
      this.analyser.getByteFrequencyData(data);
      const harmony = detectHarmonyPeaks(data, this.context.sampleRate, this.analyser.fftSize, this.referenceA4, 4);
      this.callbacks.onHarmony?.(harmony);
      this.animationFrame = requestAnimationFrame(tick);
    };
    this.animationFrame = requestAnimationFrame(tick);
  }

  async measureAverageLevel(durationMs = 2500): Promise<number> {
    if (!this.context || !this.stream) throw new Error('Start the microphone before measuring input level.');
    const samples: number[] = [];
    const started = performance.now();
    while (performance.now() - started < durationMs) {
      samples.push(this.latestInputRms);
      await new Promise((resolve) => setTimeout(resolve, 45));
    }
    const useful = samples.filter((value) => value > 0);
    if (!useful.length) return 0;
    useful.sort((a, b) => a - b);
    const low = Math.floor(useful.length * 0.15);
    const high = Math.max(low + 1, Math.ceil(useful.length * 0.9));
    const trimmed = useful.slice(low, high);
    return trimmed.reduce((sum, value) => sum + value, 0) / trimmed.length;
  }

  async calibrateSilence(durationMs = 3000): Promise<number> {
    if (!this.context || !this.stream) throw new Error('Start the microphone before calibration.');
    this.calibrationSamples = [];
    await new Promise((resolve) => setTimeout(resolve, durationMs));
    const samples = this.calibrationSamples ?? [];
    this.calibrationSamples = null;
    if (!samples.length) throw new Error('No microphone samples were captured during calibration.');
    const sorted = [...samples].sort((a, b) => a - b);
    const percentile = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.8))];
    this.noiseFloor = Math.max(0.001, Math.min(0.08, percentile * 1.15));
    this.worklet?.port.postMessage({ noiseFloor: this.noiseFloor });
    this.emitState();
    return this.noiseFloor;
  }

  setProcessing(mode: ProcessingMode, gateMultiplier = this.gateMultiplier): void {
    this.processingMode = mode;
    this.gateMultiplier = gateMultiplier;
    this.worklet?.port.postMessage({ processingMode: mode, gateMultiplier });
  }

  setReferenceA4(value: number): void {
    this.referenceA4 = Math.max(400, Math.min(480, value));
  }

  getNoiseFloor(): number {
    return this.noiseFloor;
  }

  getLatestRms(): number {
    return this.latestRms;
  }

  getLatestInputRms(): number {
    return this.latestInputRms;
  }

  startRecording(): void {
    if (!this.stream) throw new Error('Start the microphone before recording.');
    if (this.mediaRecorder?.state === 'recording') return;
    const preferredTypes = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm'];
    const mimeType = preferredTypes.find((type) => MediaRecorder.isTypeSupported(type)) || '';
    this.chunks = [];
    this.mediaRecorder = new MediaRecorder(
      this.stream,
      mimeType ? { mimeType, audioBitsPerSecond: 192000 } : undefined
    );
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size) this.chunks.push(event.data);
    };
    this.mediaRecorder.start(250);
    this.recordingStartedAt = performance.now();
    this.emitState();
  }

  stopRecording(): Promise<{ blob: Blob; duration: number; mimeType: string }> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        reject(new Error('No active recording.'));
        return;
      }
      const recorder = this.mediaRecorder;
      recorder.onstop = () => {
        const mimeType = recorder.mimeType || this.chunks[0]?.type || 'audio/webm';
        const blob = new Blob(this.chunks, { type: mimeType });
        const duration = Math.max(0, (performance.now() - this.recordingStartedAt) / 1000);
        this.mediaRecorder = null;
        this.chunks = [];
        this.emitState();
        resolve({ blob, duration, mimeType });
      };
      recorder.onerror = () => reject(new Error('Microphone recording failed.'));
      recorder.stop();
    });
  }

  async stop(): Promise<void> {
    cancelAnimationFrame(this.animationFrame);
    if (this.mediaRecorder?.state === 'recording') this.mediaRecorder.stop();
    this.worklet?.disconnect();
    this.legacyProcessor?.disconnect();
    if (this.legacyProcessor) this.legacyProcessor.onaudioprocess = null;
    this.source?.disconnect();
    this.analyser?.disconnect();
    this.silentGain?.disconnect();
    this.stream?.getTracks().forEach((track) => track.stop());
    if (this.context && this.context.state !== 'closed') await this.context.close();
    this.stream = null;
    this.context = null;
    this.source = null;
    this.worklet = null;
    this.legacyProcessor = null;
    this.analyser = null;
    this.silentGain = null;
    this.mediaRecorder = null;
    this.latestRms = 0;
    this.latestInputRms = 0;
    this.emitState();
  }

  private emitState(): void {
    const track = this.stream?.getAudioTracks()[0];
    this.callbacks.onState?.({
      active: Boolean(this.stream && this.context),
      recording: this.mediaRecorder?.state === 'recording',
      sampleRate: this.context?.sampleRate || 0,
      microphoneLabel: track?.label || '',
      noiseFloor: this.noiseFloor
    });
  }
}
