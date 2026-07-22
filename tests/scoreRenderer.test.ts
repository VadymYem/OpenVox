import { describe, expect, it } from 'vitest';
import { renderScoreSvg } from '../src/core/music/scoreRenderer';
import type { MusicalNoteEvent, ScoreDocument } from '../src/types';

function scoreWith(notes: MusicalNoteEvent[]): ScoreDocument {
  return {
    id: 'score-test',
    title: 'Renderer test',
    composer: 'OpenVox',
    tempo: 60,
    timeSignature: [4, 4],
    keyFifths: 0,
    notes,
    createdAt: 0,
    updatedAt: 0
  };
}

function note(id: string, midi: number, name: string, octave: number): MusicalNoteEvent {
  return { id, midi, note: name, octave, start: 0, duration: 1, velocity: 96, confidence: 1 };
}

function cyFor(svg: string, idLabel: string): number {
  const labelIndex = svg.indexOf(`>${idLabel}</text>`);
  expect(labelIndex).toBeGreaterThan(-1);
  const before = svg.slice(0, labelIndex);
  const ellipses = [...before.matchAll(/<ellipse cx="[^"]+" cy="([^"]+)"[^>]*>/g)];
  const ellipse = ellipses.at(-1);
  if (!ellipse) throw new Error(`No notehead found for ${idLabel}`);
  return Number(ellipse[1]);
}

describe('score renderer pitch placement', () => {
  it('places standard treble-staff reference notes on the correct lines and spaces', () => {
    const notes = [
      note('e4', 64, 'E', 4),
      { ...note('g4', 67, 'G', 4), start: 1 },
      { ...note('b4', 71, 'B', 4), start: 2 },
      { ...note('c5', 72, 'C', 5), start: 3 },
      { ...note('d5', 74, 'D', 5), start: 4 },
      { ...note('f5', 77, 'F', 5), start: 5 }
    ];
    const svg = renderScoreSvg(scoreWith(notes), 1200);
    expect(cyFor(svg, 'E4')).toBe(145);
    expect(cyFor(svg, 'G4')).toBe(135);
    expect(cyFor(svg, 'B4')).toBe(125);
    expect(cyFor(svg, 'C5')).toBe(120);
    expect(cyFor(svg, 'D5')).toBe(115);
    expect(cyFor(svg, 'F5')).toBe(105);
  });

  it('uses note spelling for flat placement when the spelling matches the MIDI pitch', () => {
    const svg = renderScoreSvg(scoreWith([note('bb4', 70, 'B♭', 4)]));
    expect(cyFor(svg, 'B♭4')).toBe(125);
    expect(svg).toContain('>♭</text>');
  });

  it('uses the explicit score label as the notation source of truth when legacy MIDI data is stale', () => {
    const svg = renderScoreSvg(scoreWith([note('legacy-c5', 36, 'C', 5)]));
    expect(svg).toContain('>C5</text>');
    expect(svg).not.toContain('>C2</text>');
    expect(cyFor(svg, 'C5')).toBe(120);
  });

  it('keeps higher octaves visually above lower octaves', () => {
    const svg = renderScoreSvg(
      scoreWith([
        note('c2', 36, 'C', 2),
        { ...note('c5', 72, 'C', 5), start: 1 }
      ])
    );
    expect(cyFor(svg, 'C5')).toBeLessThan(cyFor(svg, 'C2'));
    expect(cyFor(svg, 'C5')).toBe(120);
    expect(cyFor(svg, 'C2')).toBe(225);
  });
});
