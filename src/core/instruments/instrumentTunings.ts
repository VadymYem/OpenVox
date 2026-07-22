import type { InstrumentTuning } from '../../types';
import { midiToNote } from '../music/notes';

const s = (label: string, midi: number, course?: number) => ({
  id: `${label}-${midi}-${course || 1}`,
  label,
  midi,
  course
});

export const INSTRUMENT_TUNINGS: InstrumentTuning[] = [
  {
    id: 'guitar-standard',
    instrumentId: 'guitar',
    name: 'Guitar · Standard E',
    builtIn: true,
    strings: [s('6 · E2', 40), s('5 · A2', 45), s('4 · D3', 50), s('3 · G3', 55), s('2 · B3', 59), s('1 · E4', 64)]
  },
  {
    id: 'guitar-half-step',
    instrumentId: 'guitar',
    name: 'Guitar · Half-step down',
    builtIn: true,
    strings: [
      s('6 · Eb2', 39),
      s('5 · Ab2', 44),
      s('4 · Db3', 49),
      s('3 · Gb3', 54),
      s('2 · Bb3', 58),
      s('1 · Eb4', 63)
    ]
  },
  {
    id: 'guitar-drop-c',
    instrumentId: 'guitar',
    name: 'Guitar · Drop C',
    builtIn: true,
    strings: [s('6 · C2', 36), s('5 · G2', 43), s('4 · C3', 48), s('3 · F3', 53), s('2 · A3', 57), s('1 · D4', 62)]
  },
  {
    id: 'guitar-open-d',
    instrumentId: 'guitar',
    name: 'Guitar · Open D',
    builtIn: true,
    strings: [s('6 · D2', 38), s('5 · A2', 45), s('4 · D3', 50), s('3 · F#3', 54), s('2 · A3', 57), s('1 · D4', 62)]
  },
  {
    id: 'guitar-open-e',
    instrumentId: 'guitar',
    name: 'Guitar · Open E',
    builtIn: true,
    strings: [s('6 · E2', 40), s('5 · B2', 47), s('4 · E3', 52), s('3 · G#3', 56), s('2 · B3', 59), s('1 · E4', 64)]
  },
  {
    id: 'guitar-7-standard',
    instrumentId: 'guitar',
    name: 'Guitar · 7-string standard',
    builtIn: true,
    strings: [
      s('7 · B1', 35),
      s('6 · E2', 40),
      s('5 · A2', 45),
      s('4 · D3', 50),
      s('3 · G3', 55),
      s('2 · B3', 59),
      s('1 · E4', 64)
    ]
  },
  {
    id: 'guitar-drop-d',
    instrumentId: 'guitar',
    name: 'Guitar · Drop D',
    builtIn: true,
    strings: [s('6 · D2', 38), s('5 · A2', 45), s('4 · D3', 50), s('3 · G3', 55), s('2 · B3', 59), s('1 · E4', 64)]
  },
  {
    id: 'guitar-dadgad',
    instrumentId: 'guitar',
    name: 'Guitar · DADGAD',
    builtIn: true,
    strings: [s('6 · D2', 38), s('5 · A2', 45), s('4 · D3', 50), s('3 · G3', 55), s('2 · A3', 57), s('1 · D4', 62)]
  },
  {
    id: 'guitar-open-g',
    instrumentId: 'guitar',
    name: 'Guitar · Open G',
    builtIn: true,
    strings: [s('6 · D2', 38), s('5 · G2', 43), s('4 · D3', 50), s('3 · G3', 55), s('2 · B3', 59), s('1 · D4', 62)]
  },
  {
    id: 'bass-4',
    instrumentId: 'bass',
    name: 'Bass · 4-string',
    builtIn: true,
    strings: [s('E1', 28), s('A1', 33), s('D2', 38), s('G2', 43)]
  },
  {
    id: 'bass-5',
    instrumentId: 'bass',
    name: 'Bass · 5-string',
    builtIn: true,
    strings: [s('B0', 23), s('E1', 28), s('A1', 33), s('D2', 38), s('G2', 43)]
  },
  {
    id: 'bass-6',
    instrumentId: 'bass',
    name: 'Bass · 6-string',
    builtIn: true,
    strings: [s('B0', 23), s('E1', 28), s('A1', 33), s('D2', 38), s('G2', 43), s('C3', 48)]
  },
  {
    id: 'bass-drop-d',
    instrumentId: 'bass',
    name: 'Bass · Drop D',
    builtIn: true,
    strings: [s('D1', 26), s('A1', 33), s('D2', 38), s('G2', 43)]
  },
  {
    id: 'ukulele-standard',
    instrumentId: 'ukulele',
    name: 'Ukulele · High G',
    builtIn: true,
    strings: [s('G4', 67), s('C4', 60), s('E4', 64), s('A4', 69)]
  },
  {
    id: 'ukulele-low-g',
    instrumentId: 'ukulele',
    name: 'Ukulele · Low G',
    builtIn: true,
    strings: [s('G3', 55), s('C4', 60), s('E4', 64), s('A4', 69)]
  },
  {
    id: 'ukulele-d-tuning',
    instrumentId: 'ukulele',
    name: 'Ukulele · D tuning',
    builtIn: true,
    strings: [s('A4', 69), s('D4', 62), s('F#4', 66), s('B4', 71)]
  },
  {
    id: 'ukulele-baritone',
    instrumentId: 'ukulele',
    name: 'Baritone ukulele',
    builtIn: true,
    strings: [s('D3', 50), s('G3', 55), s('B3', 59), s('E4', 64)]
  },
  {
    id: 'violin',
    instrumentId: 'violin',
    name: 'Violin',
    builtIn: true,
    strings: [s('G3', 55), s('D4', 62), s('A4', 69), s('E5', 76)]
  },
  {
    id: 'viola',
    instrumentId: 'viola',
    name: 'Viola',
    builtIn: true,
    strings: [s('C3', 48), s('G3', 55), s('D4', 62), s('A4', 69)]
  },
  {
    id: 'cello',
    instrumentId: 'cello',
    name: 'Cello',
    builtIn: true,
    strings: [s('C2', 36), s('G2', 43), s('D3', 50), s('A3', 57)]
  },
  {
    id: 'double-bass',
    instrumentId: 'double-bass',
    name: 'Double bass · Orchestra',
    builtIn: true,
    strings: [s('E1', 28), s('A1', 33), s('D2', 38), s('G2', 43)]
  },
  {
    id: 'mandolin',
    instrumentId: 'mandolin',
    name: 'Mandolin',
    builtIn: true,
    strings: [s('G3', 55, 1), s('D4', 62, 2), s('A4', 69, 3), s('E5', 76, 4)]
  },
  {
    id: 'tenor-banjo',
    instrumentId: 'banjo',
    name: 'Tenor banjo · Standard',
    builtIn: true,
    strings: [s('C3', 48), s('G3', 55), s('D4', 62), s('A4', 69)]
  },
  {
    id: 'banjo-open-g',
    instrumentId: 'banjo',
    name: '5-string banjo · Open G',
    builtIn: true,
    strings: [s('5 · G4', 67), s('4 · D3', 50), s('3 · G3', 55), s('2 · B3', 59), s('1 · D4', 62)]
  },
  { id: 'chromatic', instrumentId: 'chromatic', name: 'Chromatic tuner', builtIn: true, strings: [] }
];

export function frequencyForMidi(midi: number, referenceA4 = 440) {
  return referenceA4 * Math.pow(2, (midi - 69) / 12);
}

export function nearestString(tuning: InstrumentTuning, midiFloat: number) {
  if (!tuning.strings.length) return null;
  return tuning.strings.reduce((best, current) =>
    Math.abs(current.midi - midiFloat) < Math.abs(best.midi - midiFloat) ? current : best
  );
}

export function tuningLabel(midi: number) {
  const note = midiToNote(midi);
  return `${note.note}${note.octave}`;
}

export function loadCustomTunings(): InstrumentTuning[] {
  try {
    const value = JSON.parse(localStorage.getItem('openvox.customTunings.v1') || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export function saveCustomTunings(tunings: InstrumentTuning[]) {
  localStorage.setItem('openvox.customTunings.v1', JSON.stringify(tunings.filter((tuning) => !tuning.builtIn)));
}
