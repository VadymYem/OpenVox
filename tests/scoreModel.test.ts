import { describe, expect, it } from 'vitest';
import { buildNotationTimeline, scoreMeasureCount, validateScoreRhythm } from '../src/core/music/scoreModel';
import type { MusicalNoteEvent, ScoreDocument } from '../src/types';

function event(
  id: string,
  start: number,
  duration: number,
  isRest = false,
  note = 'C',
  octave = 4,
  midi = 60
): MusicalNoteEvent {
  return { id, start, duration, isRest, note, octave, midi, velocity: isRest ? 1 : 96, confidence: 1 };
}

function score(notes: MusicalNoteEvent[], patch: Partial<ScoreDocument> = {}): ScoreDocument {
  return {
    id: 'rhythm',
    title: 'Rhythm',
    composer: 'OpenVox',
    tempo: 60,
    timeSignature: [4, 4],
    keyFifths: 0,
    notes,
    createdAt: 0,
    updatedAt: 0,
    ...patch
  };
}

describe('measure-complete score model', () => {
  it('keeps a half note, quarter rest and quarter note as a complete 4/4 measure', () => {
    const timeline = buildNotationTimeline(
      score([
        event('half', 0, 2),
        event('rest', 2, 1, true),
        event('quarter', 3, 1)
      ])
    );
    expect(timeline.filter((item) => item.generated)).toHaveLength(0);
    expect(timeline.filter((item) => item.isRest)).toHaveLength(1);
  });

  it('fills silent gaps with standard generated rests', () => {
    const timeline = buildNotationTimeline(score([event('half', 0, 2), event('quarter', 3, 1)]));
    const generated = timeline.filter((item) => item.generated && item.isRest);
    expect(generated).toHaveLength(1);
    expect(generated[0].startBeatInMeasure).toBe(2);
    expect(generated[0].durationBeats).toBe(1);
  });

  it('splits notes crossing a barline and adds ties', () => {
    const timeline = buildNotationTimeline(score([event('long', 3, 2)]));
    const segments = timeline.filter((item) => item.sourceId === 'long');
    expect(segments).toHaveLength(2);
    expect(segments[0].tieStart).toBe(true);
    expect(segments[1].tieStop).toBe(true);
    expect(scoreMeasureCount(score([event('long', 3, 2)]))).toBe(2);
  });

  it('reports overlaps without treating simultaneous chord notes as an error', () => {
    const chordScore = score([event('c', 0, 1), event('e', 0, 1, false, 'E', 4, 64)]);
    expect(validateScoreRhythm(chordScore).filter((issue) => issue.kind === 'overlap')).toHaveLength(0);
    const overlapScore = score([event('a', 0, 2), event('b', 1, 1)]);
    expect(validateScoreRhythm(overlapScore).some((issue) => issue.kind === 'overlap')).toBe(true);
  });
  it('keeps independent rhythms complete across multiple voices without cross-voice overlap errors', () => {
    const polyphonic = score([
      { ...event('voice-1', 0, 2), voice: 1 },
      { ...event('voice-2', 0, 1, false, 'E', 4, 64), voice: 2 }
    ]);
    const timeline = buildNotationTimeline(polyphonic);
    const voiceOneRests = timeline.filter((item) => item.generated && item.isRest && (item.voice || 1) === 1);
    const voiceTwoRests = timeline.filter((item) => item.generated && item.isRest && item.voice === 2);
    expect(voiceOneRests.reduce((sum, item) => sum + item.durationBeats, 0)).toBeCloseTo(2, 6);
    expect(voiceTwoRests.reduce((sum, item) => sum + item.durationBeats, 0)).toBeCloseTo(3, 6);
    expect(new Set(timeline.map((item) => item.id)).size).toBe(timeline.length);
    expect(validateScoreRhythm(polyphonic).filter((issue) => issue.kind === 'overlap')).toHaveLength(0);
  });

  it('normalizes small performance-timing jitter before generating notation rests', () => {
    const timeline = buildNotationTimeline(
      score([
        event('jitter-a', 0, 0.996667, false, 'C', 3, 48),
        event('jitter-b', 0.996667, 0.996666, false, 'D', 3, 50)
      ])
    );
    const generated = timeline.filter((item) => item.generated && item.isRest);
    expect(generated).toHaveLength(1);
    expect(generated[0].startBeatInMeasure).toBe(2);
    expect(generated[0].durationBeats).toBe(2);
  });

});
