import { Midi } from '@tonejs/midi';
import type { MusicalNoteEvent } from '../../types';
import { midiToNote } from './notes';
import { parseMusicXml } from './musicXmlParser';

export interface EnsemblePart {
  id: string;
  name: string;
  notes: MusicalNoteEvent[];
}

export interface EnsembleDocument {
  title: string;
  tempo: number;
  parts: EnsemblePart[];
}

function eventFromMidi(midi: number, start: number, duration: number, velocity = 96): MusicalNoteEvent {
  const info = midiToNote(midi);
  return {
    id: crypto.randomUUID(),
    midi,
    note: info.note,
    octave: info.octave,
    start,
    duration,
    velocity,
    confidence: 1
  };
}

export function importMidiEnsemble(buffer: ArrayBuffer): EnsembleDocument {
  const midi = new Midi(buffer);
  const parts = midi.tracks
    .filter((track) => track.notes.length)
    .map((track, index) => ({
      id: crypto.randomUUID(),
      name: track.name?.trim() || `Part ${index + 1}`,
      notes: track.notes.map((note) =>
        eventFromMidi(note.midi, note.time, note.duration, Math.max(1, Math.round(note.velocity * 127)))
      )
    }));
  return {
    title: midi.name || 'Imported ensemble score',
    tempo: Math.round(midi.header.tempos[0]?.bpm || 90),
    parts
  };
}

export function importMusicXmlEnsemble(text: string): EnsembleDocument {
  const parsed = parseMusicXml(text);
  return {
    title: parsed.title,
    tempo: parsed.tempo,
    parts: parsed.parts
  };
}
