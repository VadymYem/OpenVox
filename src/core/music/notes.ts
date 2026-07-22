import type { MusicalNoteEvent } from '../../types';

const NOTE_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
const FLAT_NOTE_NAMES = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭', 'A', 'B♭', 'B'];

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
  const baseMap: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const letter = match[1].toUpperCase();
  const accidentalSymbol = match[2] === '#' || match[2] === '♯' ? '♯' : match[2] === 'b' || match[2] === '♭' ? '♭' : '';
  const accidental = accidentalSymbol === '♯' ? 1 : accidentalSymbol === '♭' ? -1 : 0;
  const octave = Number(match[3]);
  const midi = Math.round((octave + 1) * 12 + baseMap[letter] + accidental);
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

export function resolveNoteSpelling(note: { midi: number; note: string; octave: number }): { note: string; octave: number } {
  const stored = parseNoteSpelling(`${note.note}${note.octave}`);
  if (stored) return { note: stored.note, octave: stored.octave };
  return midiToNote(note.midi);
}

export function synchronizeNotePitch<T extends MusicalNoteEvent>(note: T): T {
  const stored = parseNoteSpelling(`${note.note}${note.octave}`);
  if (stored) {
    return {
      ...note,
      midi: stored.midi,
      note: stored.note,
      octave: stored.octave
    };
  }

  const midi = clampMidi(note.midi);
  const fallback = midiToNote(midi);
  return {
    ...note,
    midi,
    note: fallback.note,
    octave: fallback.octave
  };
}
