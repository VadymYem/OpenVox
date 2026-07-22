export type Language = 'en' | 'uk' | 'de';
export type ThemeMode = 'system' | 'dark' | 'light';
export type ProcessingMode = 'raw' | 'vocal' | 'noisy' | 'custom';
export type DurationValue = 4 | 2 | 1 | 0.5 | 0.25 | 0.125;
export type QuantizeMode = 'free' | 4 | 8 | '8t' | 16;
export type TrainingCategory =
  'warmup' | 'pitch' | 'agility' | 'breath' | 'resonance' | 'articulation' | 'ear' | 'rhythm' | 'dynamics' | 'cooldown';
export type TrainingDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface PitchFrame {
  timestamp: number;
  frequency: number;
  midi: number;
  note: string;
  octave: number;
  cents: number;
  confidence: number;
  rms: number;
}

export interface HarmonyPitch {
  frequency: number;
  note: string;
  cents: number;
  strength: number;
}

export interface MusicalNoteEvent {
  id: string;
  midi: number;
  note: string;
  octave: number;
  start: number;
  duration: number;
  velocity: number;
  confidence: number;
  lyric?: string;
  tieStart?: boolean;
  tieStop?: boolean;
  isRest?: boolean;
}

export interface ScoreDocument {
  id: string;
  title: string;
  composer: string;
  tempo: number;
  timeSignature: [number, number];
  keyFifths: number;
  notes: MusicalNoteEvent[];
  createdAt: number;
  updatedAt: number;
}

export interface RecordingEntry {
  id: string;
  projectId: string;
  name: string;
  mimeType: string;
  blob: Blob;
  duration: number;
  createdAt: number;
}

export interface TrainingSessionEntry {
  id: string;
  projectId: string;
  exerciseId: string;
  exerciseName: string;
  category: TrainingCategory;
  difficulty: TrainingDifficulty;
  startedAt: number;
  completedAt: number;
  durationSeconds: number;
  accuracy?: number;
  hitRate?: number;
  averageCents?: number;
  bestCents?: number;
  score?: number;
  targetNote?: string;
  notes?: string;
}

export interface PracticeGoal {
  id: string;
  title: string;
  category: TrainingCategory | 'general';
  targetMinutesPerWeek: number;
  createdAt: number;
  active: boolean;
}

export interface InstrumentString {
  id: string;
  label: string;
  midi: number;
  course?: number;
}

export interface InstrumentTuning {
  id: string;
  instrumentId: string;
  name: string;
  strings: InstrumentString[];
  builtIn?: boolean;
}

export interface OpenVoxProject {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  score: ScoreDocument;
  pitchHistory: PitchFrame[];
  settings: {
    processingMode: ProcessingMode;
    noiseFloor: number;
    gateMultiplier: number;
    referenceA4: number;
  };
}

export interface AudioPreferences {
  requestedSampleRate: 32000 | 44100 | 48000 | 88200 | 96000;
  channelCount: 1 | 2;
  echoCancellation: boolean;
  noiseSuppression: boolean;
  autoGainControl: boolean;
  latencyHint: 'interactive' | 'balanced' | 'playback';
  minimumPitchHz: number;
  maximumPitchHz: number;
  confidenceThreshold: number;
  tunerToleranceCents: number;
}

export interface AccessibilityPreferences {
  reducedMotion: boolean;
  highContrast: boolean;
  largeControls: boolean;
}

export interface AppSettings {
  language: Language;
  theme: ThemeMode;
  referenceA4: number;
  processingMode: ProcessingMode;
  gateMultiplier: number;
  microphoneId: string;
  analyticsEnabled: boolean;
  audio: AudioPreferences;
  accessibility: AccessibilityPreferences;
}
