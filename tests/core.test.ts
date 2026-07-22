import assert from 'node:assert/strict';
import { frequencyToNote, midiToFrequency, parseNoteLabel, parseNoteSpelling, synchronizeNotePitch } from '../src/core/music/notes';
import { estimateTempo, quantizeNotes, transcribePitchFrames } from '../src/core/music/transcriber';
import { renderScoreSvg } from '../src/core/music/scoreRenderer';
import { scoreToMusicXml } from '../src/core/export/scoreExport';
import type { PitchFrame, ScoreDocument } from '../src/types';

const close = (actual: number, expected: number, tolerance: number) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} is not within ${tolerance} of ${expected}`);

assert.equal(parseNoteLabel('C4'), 60);
assert.equal(parseNoteLabel('F#4'), 66);
assert.equal(parseNoteLabel('B♭3'), 58);
assert.deepEqual(parseNoteSpelling('Bb4'), { midi: 70, note: 'B♭', octave: 4 });
assert.deepEqual(parseNoteSpelling('C#5'), { midi: 73, note: 'C♯', octave: 5 });
assert.deepEqual(parseNoteSpelling('b4'), { midi: 71, note: 'B', octave: 4 });
assert.deepEqual(parseNoteSpelling('bb4'), { midi: 70, note: 'B♭', octave: 4 });
assert.deepEqual(
  synchronizeNotePitch({ id: 'legacy', midi: 36, note: 'C', octave: 5, start: 0, duration: 1, velocity: 96, confidence: 1 }),
  { id: 'legacy', midi: 72, note: 'C', octave: 5, start: 0, duration: 1, velocity: 96, confidence: 1 }
);
assert.equal(parseNoteSpelling('C10'), null);
assert.equal(parseNoteSpelling('C-2'), null);
close(midiToFrequency(69), 440, 0.001);
const a4 = frequencyToNote(440);
assert.equal(a4.note, 'A');
assert.equal(a4.octave, 4);
assert.equal(a4.cents, 0);

const makeFrame = (timestamp: number, midi: number): PitchFrame => ({
  timestamp,
  frequency: midiToFrequency(midi),
  midi,
  note: frequencyToNote(midiToFrequency(midi)).note,
  octave: frequencyToNote(midiToFrequency(midi)).octave,
  cents: 0,
  confidence: 0.96,
  rms: 0.08
});

const frames: PitchFrame[] = [];
for (let i = 0; i < 12; i++) frames.push(makeFrame(i * 0.04, 60 + Math.sin(i) * 0.03));
for (let i = 0; i < 12; i++) frames.push(makeFrame(0.62 + i * 0.04, 62 + Math.sin(i) * 0.03));
for (let i = 0; i < 12; i++) frames.push(makeFrame(1.24 + i * 0.04, 64 + Math.sin(i) * 0.03));
const transcribed = transcribePitchFrames(frames);
assert.equal(transcribed.length, 3);
assert.deepEqual(
  transcribed.map((note) => note.midi),
  [60, 62, 64]
);
assert.equal(transcribed[0].start, 0);
const estimated = estimateTempo(transcribed);
assert.ok(estimated >= 80 && estimated <= 120);
const eighths = quantizeNotes(transcribed, 120, 8);
close(eighths[1].start % 0.25, 0, 1e-9);
const triplets = quantizeNotes(transcribed, 120, '8t');
close(triplets[1].start / (1 / 6) - Math.round(triplets[1].start / (1 / 6)), 0, 1e-9);
assert.notEqual(quantizeNotes(transcribed, 120, 'free'), transcribed);

const now = Date.now();
const score: ScoreDocument = {
  id: 'score-test',
  title: 'Core Test',
  composer: 'AuthorChe',
  tempo: 120,
  timeSignature: [4, 4],
  keyFifths: 0,
  notes: [
    { id: 'n1', midi: 60, note: 'C', octave: 4, start: 0, duration: 0.5, velocity: 96, confidence: 1 },
    {
      id: 'n2',
      midi: 62,
      note: 'D',
      octave: 4,
      start: 2.1,
      duration: 2.4,
      velocity: 96,
      confidence: 1,
      tieStart: true
    },
    { id: 'n3', midi: 62, note: 'D', octave: 4, start: 4.5, duration: 0.5, velocity: 96, confidence: 1, tieStop: true }
  ],
  createdAt: now,
  updatedAt: now
};
const svg = renderScoreSvg(score, 1000);
assert.match(svg, /<svg/);
assert.match(svg, /Core Test/);
assert.match(svg, />1<\/text>/);
assert.match(svg, />2<\/text>/);
const xml = scoreToMusicXml(score);
assert.match(xml, /<score-partwise version="4.0">/);
assert.match(xml, /<measure number="1">/);
assert.match(xml, /<measure number="2">/);
assert.match(xml, /<forward><duration>/);
assert.match(xml, /<tie type="start"\/>/);

console.log('Core music tests passed.');
