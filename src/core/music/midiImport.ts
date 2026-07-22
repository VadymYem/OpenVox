import { Midi } from '@tonejs/midi';
import type { ScoreDocument } from '../../types';
import { midiToNote } from './notes';

export function importMidi(arrayBuffer: ArrayBuffer): ScoreDocument {
  const midi = new Midi(arrayBuffer);
  const sourceTrack = midi.tracks.find((track) => track.notes.length > 0);
  const notes = (sourceTrack?.notes || []).map((source) => {
    const info = midiToNote(source.midi);
    return {
      id: crypto.randomUUID(),
      midi: source.midi,
      note: info.note,
      octave: info.octave,
      start: source.time,
      duration: source.duration,
      velocity: Math.round(source.velocity * 127),
      confidence: 1
    };
  });
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    title: midi.name || sourceTrack?.name || 'Imported MIDI',
    composer: 'OpenVox Studio',
    tempo: Math.round(midi.header.tempos[0]?.bpm || 90),
    timeSignature: [
      midi.header.timeSignatures[0]?.timeSignature[0] || 4,
      midi.header.timeSignatures[0]?.timeSignature[1] || 4
    ],
    keyFifths: 0,
    notes,
    createdAt: now,
    updatedAt: now
  };
}
