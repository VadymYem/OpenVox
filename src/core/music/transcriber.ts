import type { MusicalNoteEvent, PitchFrame, QuantizeMode } from '../../types';
import { midiToNote, noteLabel } from './notes';

function median(values: number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function estimateTempo(notes: MusicalNoteEvent[]): number {
  if (notes.length < 3) return 90;
  const intervals: number[] = [];
  for (let i = 1; i < notes.length; i++) {
    const interval = notes[i].start - notes[i - 1].start;
    if (interval > 0.12 && interval < 2.5) intervals.push(interval);
  }
  if (!intervals.length) return 90;
  let bpm = 60 / median(intervals);
  while (bpm < 60) bpm *= 2;
  while (bpm > 180) bpm /= 2;
  return Math.round(bpm);
}

export function quantizeNotes(notes: MusicalNoteEvent[], bpm: number, division: QuantizeMode = 8): MusicalNoteEvent[] {
  if (division === 'free') return notes.map((note) => ({ ...note }));
  const beat = 60 / Math.max(1, bpm);
  const step = division === '8t' ? beat / 3 : beat * (4 / division);
  return notes.map((note) => ({
    ...note,
    start: Math.max(0, Math.round(note.start / step) * step),
    duration: Math.max(step, Math.round(note.duration / step) * step)
  }));
}

export function transcribePitchFrames(frames: PitchFrame[]): MusicalNoteEvent[] {
  const valid = frames.filter((f) => f.confidence >= 0.68 && f.rms >= 0.004);
  if (!valid.length) return [];

  const notes: MusicalNoteEvent[] = [];
  let segment: PitchFrame[] = [valid[0]];

  const flush = () => {
    if (segment.length < 2) {
      segment = [];
      return;
    }
    const midis = segment.map((f) => f.midi);
    const midi = Math.round(median(midis));
    const start = segment[0].timestamp;
    const end = segment[segment.length - 1].timestamp;
    const duration = Math.max(0.08, end - start);
    if (duration < 0.1) {
      segment = [];
      return;
    }
    const { note, octave } = midiToNote(midi);
    notes.push({
      id: crypto.randomUUID(),
      midi,
      note,
      octave,
      start,
      duration,
      velocity: Math.round(Math.min(1, median(segment.map((f) => f.rms)) * 8) * 127),
      confidence: median(segment.map((f) => f.confidence))
    });
    segment = [];
  };

  for (let i = 1; i < valid.length; i++) {
    const current = valid[i];
    const previous = valid[i - 1];
    const gap = current.timestamp - previous.timestamp;
    const centerMidi = Math.round(median(segment.map((f) => f.midi)));
    if (gap > 0.22 || Math.abs(current.midi - centerMidi) > 0.7) {
      flush();
      segment = [current];
    } else {
      segment.push(current);
    }
  }
  flush();

  const merged: MusicalNoteEvent[] = [];
  for (const note of notes) {
    const previous = merged[merged.length - 1];
    if (previous && previous.midi === note.midi && note.start - (previous.start + previous.duration) < 0.16) {
      previous.duration = note.start + note.duration - previous.start;
      previous.confidence = (previous.confidence + note.confidence) / 2;
      previous.note = noteLabel(previous.midi).replace(/-?\d+$/, '');
    } else {
      merged.push(note);
    }
  }
  if (!merged.length) return merged;
  const offset = merged[0].start;
  return merged.map((note) => ({ ...note, start: Math.max(0, note.start - offset) }));
}
