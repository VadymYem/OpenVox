import type { MusicalNoteEvent } from '../../types';

const NOTE_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
const FLAT_NOTE_NAMES = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭', 'A', 'B♭', 'B'];
const LETTER_TO_PC: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const LETTER_TO_STEP: Record<string, number> = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 };
const STEP_TO_LETTER = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const;

export function frequencyToMidi(frequency: number, referenceA4 = 440): number {
  return 69 + 12 * Math.log2(frequency / referenceA4);
}

export function midiToFrequency(midi: number, referenceA4 = 440): number {
  return referenceA4 * 2 ** ((midi - 69) / 12);
}

export function midiToNote(midi: number, preferFlats = false): { note: string; octave: number } {
  const rounded = Math.round(midi);
  const names = preferFlats ? FLAT_NOTE_NAMES : NOTE_NAMES;
  return {
    note: names[((rounded % 12) + 12) % 12],
    octave: Math.floor(rounded / 12) - 1
  };
}

export function frequencyToNote(frequency: number, referenceA4 = 440) {
  const midiFloat = frequencyToMidi(frequency, referenceA4);
  const midi = Math.round(midiFloat);
  const { note, octave } = midiToNote(midi);
  const cents = Math.round((midiFloat - midi) * 100);
  return { midi, note, octave, cents, midiFloat };
}

export function noteLabel(midi: number): string {
  const { note, octave } = midiToNote(midi);
  return `${note}${octave}`;
}

export function centsBetween(frequency: number, targetFrequency: number): number {
  return 1200 * Math.log2(frequency / targetFrequency);
}

export function clampMidi(midi: number): number {
  return Math.max(0, Math.min(127, Math.round(midi)));
}

export function parseNoteSpelling(label: string): { midi: number; note: string; octave: number } | null {
  const match = label.trim().match(/^([A-Ga-g])([#♯b♭]?)(-?\d+)$/);
  if (!match) return null;
  const letter = match[1].toUpperCase();
  const accidentalSymbol = match[2] === '#' || match[2] === '♯' ? '♯' : match[2] === 'b' || match[2] === '♭' ? '♭' : '';
  const accidental = accidentalSymbol === '♯' ? 1 : accidentalSymbol === '♭' ? -1 : 0;
  const octave = Number(match[3]);
  const midi = Math.round((octave + 1) * 12 + LETTER_TO_PC[letter] + accidental);
  if (midi < 0 || midi > 127) return null;
  return {
    midi,
    note: `${letter}${accidentalSymbol}`,
    octave
  };
}

export function parseNoteLabel(label: string): number | null {
  return parseNoteSpelling(label)?.midi ?? null;
}

/**
 * The written spelling is the notation source of truth. This is important for
 * enharmonic notation (B♭ vs A♯) and also repairs legacy projects where the
 * visible label and the stored MIDI value drifted apart.
 */
export function resolveNoteSpelling(note: { midi: number; note: string; octave: number }): { note: string; octave: number } {
  const stored = parseNoteSpelling(`${note.note}${note.octave}`);
  if (stored) return { note: stored.note, octave: stored.octave };
  return midiToNote(note.midi);
}

export function synchronizeNotePitch<T extends MusicalNoteEvent>(event: T): T {
  if (event.isRest) {
    return {
      ...event,
      midi: clampMidi(Number.isFinite(event.midi) ? event.midi : 60),
      note: event.note || 'C',
      octave: Number.isFinite(event.octave) ? event.octave : 4,
      isRest: true
    };
  }

  const stored = parseNoteSpelling(`${event.note}${event.octave}`);
  if (stored) {
    return {
      ...event,
      midi: stored.midi,
      note: stored.note,
      octave: stored.octave,
      isRest: false
    };
  }

  const midi = clampMidi(event.midi);
  const fallback = midiToNote(midi);
  return {
    ...event,
    midi,
    note: fallback.note,
    octave: fallback.octave,
    isRest: false
  };
}

export function staffStepForSpelling(note: string, octave: number): number {
  const letter = note.charAt(0).toUpperCase();
  return octave * 7 + (LETTER_TO_STEP[letter] ?? 0);
}

export function staffStepForEvent(event: MusicalNoteEvent): number {
  const pitch = resolveNoteSpelling(synchronizeNotePitch(event));
  return staffStepForSpelling(pitch.note, pitch.octave);
}

export function spellingFromStaffStep(
  step: number,
  accidental: 'natural' | 'sharp' | 'flat' = 'natural'
): { midi: number; note: string; octave: number } | null {
  const normalizedStep = Math.round(step);
  const octave = Math.floor(normalizedStep / 7);
  const letterIndex = ((normalizedStep % 7) + 7) % 7;
  const letter = STEP_TO_LETTER[letterIndex];
  const symbol = accidental === 'sharp' ? '♯' : accidental === 'flat' ? '♭' : '';
  return parseNoteSpelling(`${letter}${symbol}${octave}`);
}

export function noteLetter(note: MusicalNoteEvent): string {
  return resolveNoteSpelling(synchronizeNotePitch(note)).note.charAt(0).toUpperCase();
}

export function noteAccidental(note: MusicalNoteEvent): -1 | 0 | 1 {
  const spelling = resolveNoteSpelling(synchronizeNotePitch(note)).note;
  if (spelling.includes('♯')) return 1;
  if (spelling.includes('♭')) return -1;
  return 0;
}
