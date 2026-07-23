import type { MusicalNoteEvent, ScoreClef, ScoreDocument, ScoreVoice } from '../../types';
import { noteAccidental, noteLetter, spellingFromStaffStep, staffStepForEvent, synchronizeNotePitch } from './notes';

export type ConcreteScoreClef = Exclude<ScoreClef, 'auto'>;

export interface NotationEvent extends MusicalNoteEvent {
  sourceId: string;
  measureIndex: number;
  startBeatInMeasure: number;
  durationBeats: number;
  generated?: boolean;
  measureRest?: boolean;
  segmentIndex?: number;
}

export interface ScoreTiming {
  tempo: number;
  beatSeconds: number;
  measureBeats: number;
  measureSeconds: number;
}

export interface ScoreRhythmIssue {
  measureIndex: number;
  voice?: ScoreVoice;
  kind: 'overflow' | 'overlap';
  message: string;
}

const EPSILON = 1e-6;
const MIN_NOTATION_GRID_BEATS = 0.0625; // 1/64 note in quarter-note beats.

function snapNotationValue(value: number, event?: Pick<MusicalNoteEvent, 'tupletActual' | 'tupletNormal'>): number {
  if (event?.tupletActual && event.tupletNormal) return value;
  return Math.round(value / MIN_NOTATION_GRID_BEATS) * MIN_NOTATION_GRID_BEATS;
}

export const SCORE_DURATION_CHOICES = [
  { id: 'whole', beats: 4, label: '1/1', shortcut: '7' },
  { id: 'half', beats: 2, label: '1/2', shortcut: '6' },
  { id: 'quarter', beats: 1, label: '1/4', shortcut: '5' },
  { id: 'eighth', beats: 0.5, label: '1/8', shortcut: '4' },
  { id: 'sixteenth', beats: 0.25, label: '1/16', shortcut: '3' },
  { id: 'thirtySecond', beats: 0.125, label: '1/32', shortcut: '2' },
  { id: 'sixtyFourth', beats: 0.0625, label: '1/64', shortcut: '1' }
] as const;

const REST_VALUES = [
  { beats: 4, alignment: 4 },
  { beats: 3, alignment: 4 },
  { beats: 2, alignment: 2 },
  { beats: 1.5, alignment: 1.5 },
  { beats: 1, alignment: 1 },
  { beats: 0.75, alignment: 1 },
  { beats: 0.5, alignment: 0.5 },
  { beats: 0.375, alignment: 0.5 },
  { beats: 0.25, alignment: 0.25 },
  { beats: 0.125, alignment: 0.125 },
  { beats: 0.0625, alignment: 0.0625 }
];

export function scoreTiming(score: ScoreDocument): ScoreTiming {
  const tempo = Math.max(20, score.tempo || 90);
  const beatSeconds = 60 / tempo;
  const measureBeats = Math.max(0.25, score.timeSignature[0] * (4 / Math.max(1, score.timeSignature[1])));
  return {
    tempo,
    beatSeconds,
    measureBeats,
    measureSeconds: measureBeats * beatSeconds
  };
}

export function resolveScoreClef(score: ScoreDocument): ConcreteScoreClef {
  if (score.clef === 'treble' || score.clef === 'bass') return score.clef;
  const pitches = score.notes
    .filter((note) => !note.isRest)
    .map((note) => synchronizeNotePitch(note).midi)
    .sort((a, b) => a - b);
  if (!pitches.length) return 'treble';
  const median = pitches[Math.floor(pitches.length / 2)];
  return median < 60 ? 'bass' : 'treble';
}

export function clefReferenceStep(clef: ConcreteScoreClef): number {
  // Middle staff line: B4 in treble, D3 in bass.
  return clef === 'treble' ? 4 * 7 + 6 : 3 * 7 + 1;
}

export function staffYForEvent(event: MusicalNoteEvent, staffCenterY: number, clef: ConcreteScoreClef): number {
  return staffCenterY - (staffStepForEvent(event) - clefReferenceStep(clef)) * 5;
}

export function pitchForStaffY(
  y: number,
  staffCenterY: number,
  clef: ConcreteScoreClef,
  accidental: 'natural' | 'sharp' | 'flat' = 'natural'
) {
  const staffStep = Math.round(clefReferenceStep(clef) + (staffCenterY - y) / 5);
  return spellingFromStaffStep(staffStep, accidental);
}

export function secondsToQuarterBeats(score: ScoreDocument, seconds: number): number {
  return seconds / scoreTiming(score).beatSeconds;
}

export function quarterBeatsToSeconds(score: ScoreDocument, beats: number): number {
  return beats * scoreTiming(score).beatSeconds;
}

export function scoreMeasureCount(score: ScoreDocument): number {
  const timing = scoreTiming(score);
  const endBeat = score.notes.reduce((max, note) => {
    const normalized = synchronizeNotePitch(note);
    const startBeat = Math.max(0, snapNotationValue(normalized.start / timing.beatSeconds, normalized));
    const durationBeat = Math.max(
      MIN_NOTATION_GRID_BEATS,
      snapNotationValue(Math.max(MIN_NOTATION_GRID_BEATS, normalized.duration / timing.beatSeconds), normalized)
    );
    return Math.max(max, startBeat + durationBeat);
  }, 0);
  const contentCount = Math.max(1, Math.ceil((endBeat - EPSILON) / timing.measureBeats));
  return Math.max(contentCount, Math.max(1, Math.floor(score.minimumMeasures || 1)));
}

function makeRest(
  score: ScoreDocument,
  measureIndex: number,
  startBeatInMeasure: number,
  durationBeats: number,
  index: number,
  measureRest = false,
  voice: ScoreVoice = 1
): NotationEvent {
  const timing = scoreTiming(score);
  return {
    id: `generated-rest-${measureIndex}-v${voice}-${Math.round(startBeatInMeasure * 1000)}-${index}`,
    sourceId: `generated-rest-${measureIndex}-v${voice}-${index}`,
    midi: 60,
    note: 'C',
    octave: 4,
    start: (measureIndex * timing.measureBeats + startBeatInMeasure) * timing.beatSeconds,
    duration: durationBeats * timing.beatSeconds,
    velocity: 1,
    confidence: 1,
    isRest: true,
    voice,
    generated: true,
    measureRest,
    measureIndex,
    startBeatInMeasure,
    durationBeats
  };
}

function splitRestGap(
  score: ScoreDocument,
  measureIndex: number,
  startBeat: number,
  durationBeats: number,
  voice: ScoreVoice = 1
): NotationEvent[] {
  const timing = scoreTiming(score);
  if (startBeat <= EPSILON && Math.abs(durationBeats - timing.measureBeats) <= EPSILON) {
    return [makeRest(score, measureIndex, 0, timing.measureBeats, 0, true, voice)];
  }

  const result: NotationEvent[] = [];
  let cursor = startBeat;
  let remaining = durationBeats;
  let index = 0;

  while (remaining > EPSILON) {
    const candidate =
      REST_VALUES.find(
        ({ beats, alignment }) =>
          beats <= remaining + EPSILON && Math.abs(cursor / alignment - Math.round(cursor / alignment)) <= EPSILON
      ) || REST_VALUES[REST_VALUES.length - 1];
    const value = Math.min(candidate.beats, remaining);
    result.push(makeRest(score, measureIndex, cursor, value, index, false, voice));
    cursor += value;
    remaining -= value;
    index += 1;
  }
  return result;
}

function splitEventAcrossMeasures(score: ScoreDocument, event: MusicalNoteEvent): NotationEvent[] {
  const timing = scoreTiming(score);
  const normalized = synchronizeNotePitch(event);
  // OpenVox stores performance timing in seconds. For notation, normalize
  // non-tuplet events to a 1/32-note grid so tiny recording jitter does not
  // explode into dozens of unreadable micro-rests. Playback still uses the
  // original score events, so this engraving normalization is non-destructive.
  const rawDurationBeats = Math.max(MIN_NOTATION_GRID_BEATS, normalized.duration / timing.beatSeconds);
  const durationBeats = Math.max(MIN_NOTATION_GRID_BEATS, snapNotationValue(rawDurationBeats, normalized));
  let absoluteStartBeat = Math.max(0, snapNotationValue(normalized.start / timing.beatSeconds, normalized));
  let remaining = durationBeats;
  const segments: NotationEvent[] = [];
  let segmentIndex = 0;

  while (remaining > EPSILON) {
    const measureIndex = Math.floor((absoluteStartBeat + EPSILON) / timing.measureBeats);
    const measureStart = measureIndex * timing.measureBeats;
    const localStart = Math.max(0, absoluteStartBeat - measureStart);
    const available = Math.max(EPSILON, timing.measureBeats - localStart);
    const segmentDuration = Math.min(remaining, available);
    const continues = remaining - segmentDuration > EPSILON;

    segments.push({
      ...normalized,
      voice: normalized.voice || 1,
      id: segmentIndex === 0 ? normalized.id : `${normalized.id}-segment-${segmentIndex}`,
      sourceId: normalized.id,
      start: absoluteStartBeat * timing.beatSeconds,
      duration: segmentDuration * timing.beatSeconds,
      measureIndex,
      startBeatInMeasure: localStart,
      durationBeats: segmentDuration,
      segmentIndex,
      tieStop: normalized.isRest ? false : Boolean(normalized.tieStop) || segmentIndex > 0,
      tieStart: normalized.isRest ? false : Boolean(normalized.tieStart) || continues
    });

    remaining -= segmentDuration;
    absoluteStartBeat += segmentDuration;
    segmentIndex += 1;
  }

  return segments;
}

function mergeIntervals(intervals: Array<[number, number]>): Array<[number, number]> {
  if (!intervals.length) return [];
  const sorted = intervals
    .map(([start, end]) => [Math.max(0, start), Math.max(start, end)] as [number, number])
    .sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const result: Array<[number, number]> = [sorted[0]];
  for (const [start, end] of sorted.slice(1)) {
    const current = result[result.length - 1];
    if (start <= current[1] + EPSILON) current[1] = Math.max(current[1], end);
    else result.push([start, end]);
  }
  return result;
}

/**
 * Converts the flat OpenVox event list into a measure-complete notation
 * timeline. Explicit events are preserved, notes crossing barlines are split
 * with ties, and silent gaps are represented by generated standard rests.
 */
export function buildNotationTimeline(score: ScoreDocument): NotationEvent[] {
  const timing = scoreTiming(score);
  const measureCount = scoreMeasureCount(score);
  const explicit = score.notes.flatMap((event) => splitEventAcrossMeasures(score, event));
  const byMeasureVoice = new Map<string, NotationEvent[]>();
  const usedVoices = new Set<ScoreVoice>([1]);

  explicit.forEach((event) => {
    const voice = event.voice || 1;
    usedVoices.add(voice);
    const key = `${event.measureIndex}:${voice}`;
    const list = byMeasureVoice.get(key) || [];
    list.push(event);
    byMeasureVoice.set(key, list);
  });

  const complete: NotationEvent[] = [...explicit];
  for (let measureIndex = 0; measureIndex < measureCount; measureIndex += 1) {
    for (const voice of [...usedVoices].sort((a, b) => a - b)) {
      const events = byMeasureVoice.get(`${measureIndex}:${voice}`) || [];
      // Voice 1 is the reference voice and is always rhythmically complete.
      // Secondary voices only receive generated rests in measures where they
      // actually contain explicit material, avoiding unnecessary clutter.
      if (voice !== 1 && events.length === 0) continue;
      const occupied = mergeIntervals(
        events.map((event) => [
          event.startBeatInMeasure,
          Math.min(timing.measureBeats, event.startBeatInMeasure + event.durationBeats)
        ])
      );
      let cursor = 0;
      for (const [start, end] of occupied) {
        if (start > cursor + EPSILON) {
          complete.push(...splitRestGap(score, measureIndex, cursor, start - cursor, voice));
        }
        cursor = Math.max(cursor, end);
      }
      if (cursor < timing.measureBeats - EPSILON) {
        complete.push(...splitRestGap(score, measureIndex, cursor, timing.measureBeats - cursor, voice));
      }
    }
  }

  return complete.sort(
    (a, b) =>
      a.measureIndex - b.measureIndex ||
      a.startBeatInMeasure - b.startBeatInMeasure ||
      (a.voice || 1) - (b.voice || 1) ||
      Number(Boolean(a.isRest)) - Number(Boolean(b.isRest)) ||
      a.midi - b.midi
  );
}

export function validateScoreRhythm(score: ScoreDocument): ScoreRhythmIssue[] {
  const timing = scoreTiming(score);
  const issues: ScoreRhythmIssue[] = [];
  const events = score.notes.map(synchronizeNotePitch).sort((a, b) => a.start - b.start || a.midi - b.midi);
  const byMeasureVoice = new Map<string, MusicalNoteEvent[]>();

  events.forEach((event) => {
    const startBeat = event.start / timing.beatSeconds;
    const measureIndex = Math.floor((startBeat + EPSILON) / timing.measureBeats);
    const voice = event.voice || 1;
    const key = `${measureIndex}:${voice}`;
    const list = byMeasureVoice.get(key) || [];
    list.push(event);
    byMeasureVoice.set(key, list);
    const localStart = startBeat - measureIndex * timing.measureBeats;
    const durationBeats = event.duration / timing.beatSeconds;
    if (localStart + durationBeats > timing.measureBeats + EPSILON && !event.tieStart) {
      issues.push({
        measureIndex,
        voice,
        kind: 'overflow',
        message: `Event ${event.id} crosses the barline and will be split with a tie.`
      });
    }
  });

  byMeasureVoice.forEach((measureEvents, key) => {
    const [measureText, voiceText] = key.split(':');
    const measureIndex = Number(measureText);
    const voice = Number(voiceText) as ScoreVoice;
    const occupied = measureEvents
      .filter((event) => !event.isRest)
      .map((event) => {
        const start = event.start / timing.beatSeconds - measureIndex * timing.measureBeats;
        return [start, start + event.duration / timing.beatSeconds, event.id] as const;
      })
      .sort((a, b) => a[0] - b[0]);
    for (let index = 1; index < occupied.length; index += 1) {
      const previous = occupied[index - 1];
      const current = occupied[index];
      const sameStart = Math.abs(previous[0] - current[0]) <= EPSILON;
      if (!sameStart && current[0] < previous[1] - EPSILON) {
        issues.push({
          measureIndex,
          voice,
          kind: 'overlap',
          message: `Events ${previous[2]} and ${current[2]} overlap in time.`
        });
      }
    }
  });

  return issues;
}

const SHARP_ORDER = ['F', 'C', 'G', 'D', 'A', 'E', 'B'];
const FLAT_ORDER = ['B', 'E', 'A', 'D', 'G', 'C', 'F'];

export function keySignatureAccidentalForLetter(keyFifths: number, letter: string): -1 | 0 | 1 {
  const normalized = letter.toUpperCase();
  if (keyFifths > 0 && SHARP_ORDER.slice(0, Math.min(7, keyFifths)).includes(normalized)) return 1;
  if (keyFifths < 0 && FLAT_ORDER.slice(0, Math.min(7, Math.abs(keyFifths))).includes(normalized)) return -1;
  return 0;
}

export function accidentalSymbolForEvent(
  event: MusicalNoteEvent,
  keyFifths: number,
  state: Map<string, -1 | 0 | 1>
): '♯' | '♭' | '♮' | '' {
  if (event.isRest) return '';
  const normalized = synchronizeNotePitch(event);
  const letter = noteLetter(normalized);
  const stateKey = `${letter}${normalized.octave}`;
  const desired = noteAccidental(normalized);
  const current = state.has(stateKey) ? state.get(stateKey)! : keySignatureAccidentalForLetter(keyFifths, letter);
  if (desired === current) return '';
  state.set(stateKey, desired);
  return desired === 1 ? '♯' : desired === -1 ? '♭' : '♮';
}

export const KEY_SIGNATURE_LABELS: Array<{ fifths: number; label: string }> = [
  { fifths: -7, label: 'C♭ / A♭m' },
  { fifths: -6, label: 'G♭ / E♭m' },
  { fifths: -5, label: 'D♭ / B♭m' },
  { fifths: -4, label: 'A♭ / Fm' },
  { fifths: -3, label: 'E♭ / Cm' },
  { fifths: -2, label: 'B♭ / Gm' },
  { fifths: -1, label: 'F / Dm' },
  { fifths: 0, label: 'C / Am' },
  { fifths: 1, label: 'G / Em' },
  { fifths: 2, label: 'D / Bm' },
  { fifths: 3, label: 'A / F♯m' },
  { fifths: 4, label: 'E / C♯m' },
  { fifths: 5, label: 'B / G♯m' },
  { fifths: 6, label: 'F♯ / D♯m' },
  { fifths: 7, label: 'C♯ / A♯m' }
];
