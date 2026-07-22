import type { MusicalNoteEvent, TrainingCategory, TrainingDifficulty } from '../../types';
import { midiToNote } from '../music/notes';

export interface TrainingExerciseDefinition {
  id: string;
  name: string;
  category: TrainingCategory;
  difficulty: TrainingDifficulty;
  minutes: number;
  description: string;
  instruction: string;
  intervals?: number[];
  syllable?: string;
  tempo?: number;
  transpose?: boolean;
  breathPattern?: [number, number, number, number];
  focus: string[];
}

export const TRAINING_LIBRARY: TrainingExerciseDefinition[] = [
  {
    id: 'lip-trill-5tone',
    name: 'Lip trill five-tone',
    category: 'warmup',
    difficulty: 'beginner',
    minutes: 4,
    description: 'Gentle five-note warm-up through a comfortable range.',
    instruction: 'Keep airflow even and the lips loose. Stop before pushing the top or bottom of the range.',
    intervals: [0, 2, 4, 5, 7, 5, 4, 2, 0],
    syllable: 'brr',
    tempo: 82,
    transpose: true,
    focus: ['warm-up', 'airflow', 'registration']
  },
  {
    id: 'ng-siren',
    name: 'NG resonance siren',
    category: 'resonance',
    difficulty: 'beginner',
    minutes: 3,
    description: 'Smooth glissando for resonance awareness and register connection.',
    instruction: 'Use a light “ng” and glide without forcing volume.',
    focus: ['resonance', 'register bridge', 'smoothness']
  },
  {
    id: 'straw-flow',
    name: 'Semi-occluded flow pattern',
    category: 'warmup',
    difficulty: 'beginner',
    minutes: 4,
    description: 'Light sustained pattern designed for low-effort onset and steady airflow.',
    instruction: 'Use a straw or lip trill if available. Keep the sensation easy and stop if there is discomfort.',
    intervals: [0, 4, 7, 4, 0],
    syllable: 'vu',
    tempo: 68,
    transpose: true,
    focus: ['easy onset', 'airflow', 'warm-up']
  },
  {
    id: 'major-scale-legato',
    name: 'Major scale legato',
    category: 'pitch',
    difficulty: 'beginner',
    minutes: 5,
    description: 'One-octave scale for intonation and connected phrasing.',
    instruction: 'Match each pitch cleanly without scooping. Keep the vowel stable.',
    intervals: [0, 2, 4, 5, 7, 9, 11, 12, 11, 9, 7, 5, 4, 2, 0],
    syllable: 'ah',
    tempo: 76,
    transpose: true,
    focus: ['intonation', 'legato', 'scale']
  },
  {
    id: 'major-arpeggio',
    name: 'Major arpeggio',
    category: 'pitch',
    difficulty: 'beginner',
    minutes: 4,
    description: 'Root–third–fifth–octave pitch targeting.',
    instruction: 'Hear the next note internally before singing it.',
    intervals: [0, 4, 7, 12, 7, 4, 0],
    syllable: 'no',
    tempo: 72,
    transpose: true,
    focus: ['intervals', 'intonation', 'support']
  },
  {
    id: 'minor-arpeggio',
    name: 'Minor arpeggio',
    category: 'pitch',
    difficulty: 'intermediate',
    minutes: 4,
    description: 'Minor triad and octave tuning.',
    instruction: 'Keep the minor third centered and avoid dragging the descending line.',
    intervals: [0, 3, 7, 12, 7, 3, 0],
    syllable: 'nee',
    tempo: 72,
    transpose: true,
    focus: ['minor tonality', 'intonation']
  },
  {
    id: 'chromatic-5',
    name: 'Chromatic five-note',
    category: 'agility',
    difficulty: 'intermediate',
    minutes: 5,
    description: 'Compact chromatic pattern for pitch precision.',
    instruction: 'Stay light and rhythmically even. Increase tempo only after clean repetitions.',
    intervals: [0, 1, 2, 3, 4, 3, 2, 1, 0],
    syllable: 'gi',
    tempo: 96,
    transpose: true,
    focus: ['agility', 'chromatic tuning', 'clarity']
  },
  {
    id: 'rossini-scale',
    name: 'Fast octave scale',
    category: 'agility',
    difficulty: 'advanced',
    minutes: 6,
    description: 'Fast ascending and descending major scale for agility.',
    instruction: 'Use small, efficient movements and avoid increasing jaw tension.',
    intervals: [0, 2, 4, 5, 7, 9, 11, 12, 11, 9, 7, 5, 4, 2, 0],
    syllable: 'di',
    tempo: 132,
    transpose: true,
    focus: ['agility', 'coordination', 'speed']
  },
  {
    id: 'thirds-pattern',
    name: 'Scale in thirds',
    category: 'agility',
    difficulty: 'advanced',
    minutes: 6,
    description: 'Alternating scale thirds across an octave.',
    instruction: 'Keep each leap clean; do not smear between target notes.',
    intervals: [0, 4, 2, 5, 4, 7, 5, 9, 7, 11, 9, 12, 11, 14, 12],
    syllable: 'la',
    tempo: 104,
    transpose: true,
    focus: ['agility', 'thirds', 'intonation']
  },
  {
    id: 'fifth-jumps',
    name: 'Perfect-fifth jumps',
    category: 'pitch',
    difficulty: 'intermediate',
    minutes: 5,
    description: 'Repeated fifths for interval accuracy.',
    instruction: 'Prepare the upper pitch mentally before the jump and keep the onset clean.',
    intervals: [0, 7, 0, 7, 2, 9, 2, 9, 4, 11, 4, 11],
    syllable: 'ya',
    tempo: 74,
    transpose: false,
    focus: ['intervals', 'onset', 'accuracy']
  },
  {
    id: 'octave-jumps',
    name: 'Octave jumps',
    category: 'pitch',
    difficulty: 'advanced',
    minutes: 5,
    description: 'Octave targeting across register transitions.',
    instruction: 'Use moderate volume and avoid carrying excess weight upward.',
    intervals: [0, 12, 0, 12, 2, 14, 2, 14, 4, 16],
    syllable: 'woo',
    tempo: 68,
    transpose: false,
    focus: ['octaves', 'register balance', 'accuracy']
  },
  {
    id: 'messa-di-voce-lite',
    name: 'Controlled swell',
    category: 'dynamics',
    difficulty: 'intermediate',
    minutes: 5,
    description: 'Sustain a comfortable pitch while gradually growing and reducing intensity.',
    instruction: 'Keep pitch centered while changing loudness. Do not force maximum volume.',
    focus: ['dynamics', 'stability', 'breath control']
  },
  {
    id: 'long-tone-stability',
    name: 'Long-tone stability',
    category: 'pitch',
    difficulty: 'beginner',
    minutes: 5,
    description: 'Sustained notes for centering and steadiness.',
    instruction: 'Aim for a stable center rather than chasing every small tuner movement.',
    intervals: [0, 2, 4, 5, 7],
    syllable: 'oo',
    tempo: 52,
    transpose: false,
    focus: ['stability', 'sustain', 'intonation']
  },
  {
    id: 'vibrato-observation',
    name: 'Vibrato observation',
    category: 'dynamics',
    difficulty: 'intermediate',
    minutes: 4,
    description: 'Sustain a comfortable note and observe vibrato rate and width.',
    instruction: 'Do not manufacture oscillation. Let natural vibrato emerge while staying comfortable.',
    focus: ['vibrato', 'stability', 'awareness']
  },
  {
    id: 'breath-4-2-8',
    name: '4–2–8 breath cycle',
    category: 'breath',
    difficulty: 'beginner',
    minutes: 4,
    description: 'Calm inhale–hold–exhale cycle for breath pacing.',
    instruction: 'Stay relaxed. Stop if you feel dizzy or uncomfortable.',
    breathPattern: [4, 2, 8, 2],
    focus: ['breath pacing', 'relaxation']
  },
  {
    id: 'breath-4-4-12',
    name: '4–4–12 breath cycle',
    category: 'breath',
    difficulty: 'intermediate',
    minutes: 5,
    description: 'Longer controlled exhalation pattern.',
    instruction: 'Keep shoulders relaxed and avoid straining the breath hold.',
    breathPattern: [4, 4, 12, 3],
    focus: ['breath control', 'exhalation']
  },
  {
    id: 'fricative-sustain',
    name: 'Fricative airflow',
    category: 'breath',
    difficulty: 'beginner',
    minutes: 4,
    description: 'Timed sustained “s” or “f” for even outgoing airflow.',
    instruction: 'Use a consistent quiet stream rather than maximum duration at any cost.',
    focus: ['airflow', 'consistency', 'support']
  },
  {
    id: 'vowel-chain',
    name: 'Vowel chain',
    category: 'articulation',
    difficulty: 'beginner',
    minutes: 4,
    description: 'Connected [i-e-a-o-u] sequence on a stable pitch pattern.',
    instruction: 'Keep the jaw free and avoid changing pitch while changing vowels.',
    intervals: [0, 2, 4, 2, 0],
    syllable: 'i-e-a-o-u',
    tempo: 72,
    transpose: true,
    focus: ['vowels', 'articulation', 'resonance']
  },
  {
    id: 'consonant-agility',
    name: 'Consonant agility',
    category: 'articulation',
    difficulty: 'intermediate',
    minutes: 5,
    description: 'Fast consonant-vowel coordination over a five-note pattern.',
    instruction: 'Keep consonants crisp without interrupting airflow.',
    intervals: [0, 2, 4, 5, 7, 5, 4, 2, 0],
    syllable: 'da-ga-da-ga',
    tempo: 104,
    transpose: true,
    focus: ['diction', 'agility', 'coordination']
  },
  {
    id: 'pitch-memory',
    name: 'Pitch memory',
    category: 'ear',
    difficulty: 'beginner',
    minutes: 5,
    description: 'Hear a note, wait briefly, then reproduce it.',
    instruction: 'Internalize the sound before singing. Use the tuner only after the attempt.',
    focus: ['audiation', 'pitch memory', 'matching']
  },
  {
    id: 'interval-identification',
    name: 'Interval identification',
    category: 'ear',
    difficulty: 'intermediate',
    minutes: 6,
    description: 'Identify intervals by ear from unison through octave.',
    instruction: 'Listen to the size and character before answering.',
    focus: ['ear training', 'intervals']
  },
  {
    id: 'interval-singback',
    name: 'Interval sing-back',
    category: 'ear',
    difficulty: 'advanced',
    minutes: 6,
    description: 'Hear a starting note and target interval, then sing the destination pitch.',
    instruction: 'Imagine the destination before vocalizing.',
    focus: ['audiation', 'interval production', 'pitch']
  },
  {
    id: 'steady-pulse',
    name: 'Steady pulse',
    category: 'rhythm',
    difficulty: 'beginner',
    minutes: 4,
    description: 'Tap consistently with an adjustable metronome.',
    instruction: 'Keep movements economical and aim for equal spacing between taps.',
    tempo: 80,
    focus: ['pulse', 'timing']
  },
  {
    id: 'subdivision-switch',
    name: 'Subdivision switch',
    category: 'rhythm',
    difficulty: 'intermediate',
    minutes: 5,
    description: 'Alternate quarter, eighth and triplet subdivisions.',
    instruction: 'Keep the underlying beat unchanged while subdivisions change.',
    tempo: 72,
    focus: ['subdivision', 'timing', 'coordination']
  },
  {
    id: 'syncopation-grid',
    name: 'Syncopation grid',
    category: 'rhythm',
    difficulty: 'advanced',
    minutes: 6,
    description: 'Practice off-beat entries against a stable click.',
    instruction: 'Count subdivisions internally and keep the main beat stable.',
    tempo: 84,
    focus: ['syncopation', 'timing']
  },
  {
    id: 'descending-hum',
    name: 'Descending hum cooldown',
    category: 'cooldown',
    difficulty: 'beginner',
    minutes: 3,
    description: 'Gentle descending humming after intense practice.',
    instruction: 'Use low effort and stop before reaching an uncomfortable low pitch.',
    intervals: [7, 5, 4, 2, 0],
    syllable: 'mm',
    tempo: 66,
    transpose: true,
    focus: ['cooldown', 'release', 'resonance']
  },
  {
    id: 'gentle-sigh',
    name: 'Gentle sigh release',
    category: 'cooldown',
    difficulty: 'beginner',
    minutes: 2,
    description: 'Easy downward sighs to release unnecessary effort.',
    instruction: 'Keep it quiet and comfortable; this is not a range test.',
    focus: ['cooldown', 'release']
  }
];

export function exercisesByCategory(category: TrainingCategory) {
  return TRAINING_LIBRARY.filter((exercise) => exercise.category === category);
}

export function buildExerciseNotes(
  exercise: TrainingExerciseDefinition,
  rootMidi: number,
  referenceTempo?: number
): MusicalNoteEvent[] {
  if (!exercise.intervals?.length) return [];
  const bpm = referenceTempo || exercise.tempo || 80;
  const beat = 60 / bpm;
  return exercise.intervals.map((interval, index) => {
    const midi = rootMidi + interval;
    const note = midiToNote(midi);
    return {
      id: crypto.randomUUID(),
      midi,
      note: note.note,
      octave: note.octave,
      start: index * beat,
      duration: beat * 0.76,
      velocity: 90,
      confidence: 1,
      lyric: exercise.syllable
    };
  });
}

export function buildSessionPlan(
  minutes: number,
  difficulty: TrainingDifficulty,
  focus: TrainingCategory | 'balanced' = 'balanced'
) {
  const safeMinutes = Math.max(5, Math.min(90, minutes));
  const plan: TrainingExerciseDefinition[] = [];
  const add = (category: TrainingCategory) => {
    const candidates = TRAINING_LIBRARY.filter(
      (item) => item.category === category && (item.difficulty === difficulty || item.difficulty === 'beginner')
    );
    const next = candidates.find((item) => !plan.some((selected) => selected.id === item.id));
    if (next) plan.push(next);
  };
  add('warmup');
  if (focus !== 'balanced') add(focus);
  const rotation: TrainingCategory[] =
    focus === 'balanced'
      ? ['pitch', 'agility', 'breath', 'resonance', 'articulation', 'ear', 'rhythm', 'dynamics']
      : ['pitch', 'breath', 'ear', 'rhythm', 'agility', 'resonance'];
  for (const category of rotation) {
    if (plan.reduce((sum, item) => sum + item.minutes, 0) >= safeMinutes - 3) break;
    add(category);
  }
  add('cooldown');
  return plan;
}
