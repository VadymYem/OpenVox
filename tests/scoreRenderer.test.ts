import { describe, expect, it } from 'vitest';
import { renderScoreSvg } from '../src/core/music/scoreRenderer';
import type { MusicalNoteEvent, ScoreDocument } from '../src/types';

function scoreWith(notes: MusicalNoteEvent[], patch: Partial<ScoreDocument> = {}): ScoreDocument {
  return {
    id: 'score-test',
    title: 'Renderer test',
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

function note(id: string, midi: number, name: string, octave: number, start = 0, duration = 1): MusicalNoteEvent {
  return { id, midi, note: name, octave, start, duration, velocity: 96, confidence: 1 };
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
      note('e4', 64, 'E', 4, 0),
      note('g4', 67, 'G', 4, 1),
      note('b4', 71, 'B', 4, 2),
      note('c5', 72, 'C', 5, 3),
      note('d5', 74, 'D', 5, 4),
      note('f5', 77, 'F', 5, 5)
    ];
    const svg = renderScoreSvg(scoreWith(notes), 1200, { showPitchLabels: true });
    expect(cyFor(svg, 'E4')).toBe(142);
    expect(cyFor(svg, 'G4')).toBe(132);
    expect(cyFor(svg, 'B4')).toBe(122);
    expect(cyFor(svg, 'C5')).toBe(117);
    expect(cyFor(svg, 'D5')).toBe(112);
    expect(cyFor(svg, 'F5')).toBe(102);
  });

  it('uses the written pitch as source of truth when legacy MIDI data is stale', () => {
    const svg = renderScoreSvg(scoreWith([note('legacy-c5', 36, 'C', 5)]), 1200, { showPitchLabels: true });
    expect(svg).toContain('>C5</text>');
    expect(svg).not.toContain('>C2</text>');
    expect(cyFor(svg, 'C5')).toBe(117);
  });

  it('keeps higher octaves visually above lower octaves', () => {
    const svg = renderScoreSvg(
      scoreWith([note('c2', 36, 'C', 2), note('c5', 72, 'C', 5, 1)]),
      1200,
      { showPitchLabels: true }
    );
    expect(cyFor(svg, 'C5')).toBeLessThan(cyFor(svg, 'C2'));
  });

  it('draws key signatures on the staff and suppresses redundant accidentals', () => {
    const score = scoreWith(
      [
        note('fs4', 66, 'F♯', 4, 0),
        note('f4', 65, 'F', 4, 1)
      ],
      { keyFifths: 1, clef: 'treble' }
    );
    const svg = renderScoreSvg(score, 1200, { showPitchLabels: true });
    expect((svg.match(/>♯<\/text>/g) || []).length).toBe(1); // key signature only
    expect(svg).toContain('>♮</text>'); // F natural cancels the key signature
  });

  it('renders rests with SVG geometry rather than missing-font music glyphs', () => {
    const svg = renderScoreSvg(
      scoreWith([
        { ...note('half-rest', 60, 'C', 4, 0, 2), isRest: true },
        note('quarter-note', 60, 'C', 4, 3, 1)
      ])
    );
    expect(svg).toContain('data-event-kind="rest"');
    for (const glyph of ['𝄻', '𝄼', '𝄽', '𝄾', '𝄿']) expect(svg).not.toContain(glyph);
    expect(svg).toMatch(/data-event-kind="rest"[^>]*>[\s\S]*?(?:<rect|<path)/);
  });

  it('renders a full-measure rest when a measure has no explicit events', () => {
    const svg = renderScoreSvg(scoreWith([], { minimumMeasures: 2 }));
    expect((svg.match(/data-event-kind="rest"/g) || []).length).toBe(2);
    expect(svg).toContain('data-generated="true"');
  });
  it('automatically beams consecutive eighth notes inside the same pulse', () => {
    const svg = renderScoreSvg(
      scoreWith([
        note('eighth-1', 72, 'C', 5, 0, 0.5),
        note('eighth-2', 74, 'D', 5, 0.5, 0.5),
        note('quarter', 76, 'E', 5, 1, 1)
      ])
    );
    expect((svg.match(/stroke-width="5"/g) || []).length).toBeGreaterThanOrEqual(1);
  });

  it('engraves adjacent chord tones with displaced noteheads and one shared stem', () => {
    const svg = renderScoreSvg(
      scoreWith([
        note('chord-c', 60, 'C', 4, 0, 1),
        note('chord-d', 62, 'D', 4, 0, 1),
        note('chord-g', 67, 'G', 4, 0, 1)
      ])
    );
    const noteheads = [...svg.matchAll(/<ellipse cx="([^"]+)" cy="([^"]+)"/g)].slice(0, 3);
    expect(noteheads).toHaveLength(3);
    expect(new Set(noteheads.map((match) => match[1])).size).toBeGreaterThan(1);
    expect((svg.match(/data-chord-stem="true"/g) || []).length).toBe(1);
  });

  it('renders articulations, dynamics and slurs as functional score markings', () => {
    const svg = renderScoreSvg(
      scoreWith([
        { ...note('expressive-a', 72, 'C', 5, 0, 1), articulation: 'staccato', dynamic: 'mf', slurStart: true },
        { ...note('expressive-b', 74, 'D', 5, 1, 1), articulation: 'accent', slurStop: true }
      ])
    );
    expect(svg).toContain('data-articulation="staccato"');
    expect(svg).toContain('data-articulation="accent"');
    expect(svg).toContain('data-dynamic="mf"');
    expect(svg).toContain('data-score-slur="true"');
  });


  it('uses opposing stem directions and separate rest lanes for multiple voices', () => {
    const svg = renderScoreSvg(
      scoreWith([
        { ...note('voice-1-note', 67, 'G', 4, 0, 1), voice: 1 },
        { ...note('voice-2-note', 60, 'C', 4, 0, 1), voice: 2 }
      ])
    );
    expect(svg).toContain('data-stem-direction="up" data-voice="1"');
    expect(svg).toContain('data-stem-direction="down" data-voice="2"');
    expect(svg).toContain('data-event-kind="rest" data-voice="1"');
    expect(svg).toContain('data-event-kind="rest" data-voice="2"');
  });


});

describe('score renderer tuplets', () => {
  it('renders a bracket and number for a complete triplet group', () => {
    const tripletDuration = 1 / 3;
    const notes = [0, 1, 2].map((index) => ({
      ...note(`triplet-${index}`, 72 + index * 2, ['C', 'D', 'E'][index], 5, index * tripletDuration, tripletDuration),
      tupletActual: 3,
      tupletNormal: 2,
      tupletGroupId: 'triplet-a'
    }));
    const svg = renderScoreSvg(scoreWith(notes));
    expect(svg).toContain('data-score-tuplet="triplet-a"');
    expect(svg).toMatch(/>3<\/text>/);
  });
});
