import { describe, expect, it } from 'vitest';
import { transformRehearsalNotes } from '../src/pages/ChoirPage';
import type { MusicalNoteEvent } from '../src/types';

const note = (id: string, midi: number, start: number, duration: number): MusicalNoteEvent => ({
  id,
  midi,
  note: 'A',
  octave: 4,
  start,
  duration,
  velocity: 100,
  confidence: 1
});

describe('choir passage rehearsal', () => {
  it('clips to a passage and scales time for slower rehearsal', () => {
    const transformed = transformRehearsalNotes(
      [note('a', 60, 0, 1), note('b', 62, 2, 1), note('c', 64, 4, 1)],
      1.5,
      4,
      0.5,
      1
    );
    expect(transformed).toHaveLength(2);
    expect(transformed[0].start).toBe(1);
    expect(transformed[0].duration).toBe(2);
    expect(transformed[1].start).toBe(5);
  });

  it('repeats the transformed passage on a deterministic rehearsal timeline', () => {
    const transformed = transformRehearsalNotes([note('a', 60, 10, 1)], 10, 12, 1, 3);
    expect(transformed).toHaveLength(3);
    expect(transformed.map((item) => item.start)).toEqual([0, 2, 4]);
  });
});
