import { describe, expect, it } from 'vitest';
import { frequencyForMidi, INSTRUMENT_TUNINGS, nearestString } from '../src/core/instruments/instrumentTunings';

describe('instrument tuning library', () => {
  it('contains broad built-in presets plus a chromatic mode', () => {
    expect(INSTRUMENT_TUNINGS.length).toBeGreaterThanOrEqual(20);
    expect(INSTRUMENT_TUNINGS.some((item) => item.id === 'guitar-7-standard')).toBe(true);
    expect(INSTRUMENT_TUNINGS.some((item) => item.id === 'bass-6')).toBe(true);
    expect(INSTRUMENT_TUNINGS.some((item) => item.id === 'chromatic')).toBe(true);
  });

  it('uses the configured concert pitch reference', () => {
    expect(frequencyForMidi(69, 440)).toBeCloseTo(440, 8);
    expect(frequencyForMidi(69, 442)).toBeCloseTo(442, 8);
  });

  it('matches the nearest target string by floating MIDI pitch', () => {
    const guitar = INSTRUMENT_TUNINGS.find((item) => item.id === 'guitar-standard');
    expect(guitar).toBeTruthy();
    expect(nearestString(guitar!, 58.8)?.midi).toBe(59);
  });
});
