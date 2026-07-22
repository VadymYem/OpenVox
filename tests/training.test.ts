import { describe, expect, it } from 'vitest';
import { buildExerciseNotes, buildSessionPlan, TRAINING_LIBRARY } from '../src/core/training/trainingLibrary';
import { frequencyForMidi, INSTRUMENT_TUNINGS, nearestString } from '../src/core/instruments/instrumentTunings';

describe('training library', () => {
  it('contains a broad set of structured vocal exercises', () => {
    expect(TRAINING_LIBRARY.length).toBeGreaterThanOrEqual(25);
    expect(new Set(TRAINING_LIBRARY.map((item) => item.category)).size).toBeGreaterThanOrEqual(9);
  });
  it('builds a balanced practice session with warm-up and cooldown', () => {
    const plan = buildSessionPlan(30, 'intermediate', 'balanced');
    expect(plan[0].category).toBe('warmup');
    expect(plan.at(-1)?.category).toBe('cooldown');
    expect(plan.reduce((sum, item) => sum + item.minutes, 0)).toBeGreaterThanOrEqual(20);
  });
  it('turns interval patterns into playable notes', () => {
    const exercise = TRAINING_LIBRARY.find((item) => item.id === 'major-scale-legato')!;
    const notes = buildExerciseNotes(exercise, 60);
    expect(notes[0].midi).toBe(60);
    expect(Math.max(...notes.map((note) => note.midi))).toBe(72);
  });
});

describe('instrument tuning library', () => {
  it('includes common fretted and orchestral string presets', () => {
    for (const id of [
      'guitar-standard',
      'guitar-drop-d',
      'bass-5',
      'ukulele-standard',
      'violin',
      'viola',
      'cello',
      'mandolin',
      'chromatic'
    ]) {
      expect(INSTRUMENT_TUNINGS.some((item) => item.id === id)).toBe(true);
    }
  });
  it('calculates A4 and selects the nearest target string', () => {
    expect(frequencyForMidi(69, 440)).toBeCloseTo(440, 6);
    const guitar = INSTRUMENT_TUNINGS.find((item) => item.id === 'guitar-standard')!;
    expect(nearestString(guitar, 64.1)?.midi).toBe(64);
  });
});
