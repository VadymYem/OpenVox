import { describe, expect, it } from 'vitest';
import { importMusicXml } from '../src/core/music/musicXmlImport';
import { importMusicXmlEnsemble } from '../src/core/music/ensembleImport';

const COMPLEX_XML = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="4.0">
  <work><work-title>Polyphonic Test</work-title></work>
  <identification><creator type="composer">AuthorChe</creator></identification>
  <part-list>
    <score-part id="P1"><part-name>Soprano</part-name></score-part>
    <score-part id="P2"><part-name>Alto</part-name></score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes><divisions>4</divisions><key><fifths>1</fifths></key><time><beats>4</beats><beat-type>4</beat-type></time></attributes>
      <direction><sound tempo="120"/></direction>
      <note><pitch><step>C</step><octave>4</octave></pitch><duration>4</duration><tie type="start"/><lyric><text>La</text></lyric></note>
      <note><chord/><pitch><step>E</step><octave>4</octave></pitch><duration>4</duration></note>
      <backup><duration>4</duration></backup>
      <note><pitch><step>G</step><octave>3</octave></pitch><duration>8</duration></note>
    </measure>
    <measure number="2">
      <forward><duration>4</duration></forward>
      <note><pitch><step>D</step><alter>1</alter><octave>4</octave></pitch><duration>4</duration><tie type="stop"/></note>
    </measure>
  </part>
  <part id="P2">
    <measure number="1">
      <attributes><divisions>4</divisions></attributes>
      <note><pitch><step>A</step><octave>3</octave></pitch><duration>8</duration></note>
    </measure>
  </part>
</score-partwise>`;

describe('MusicXML import', () => {
  it('preserves chords, voices, forward timing and ties in the first score part', () => {
    const score = importMusicXml(COMPLEX_XML);
    expect(score.title).toBe('Polyphonic Test');
    expect(score.composer).toBe('AuthorChe');
    expect(score.tempo).toBe(120);
    expect(score.timeSignature).toEqual([4, 4]);
    expect(score.keyFifths).toBe(1);
    expect(score.notes).toHaveLength(4);

    const c4 = score.notes.find((note) => note.midi === 60)!;
    const e4 = score.notes.find((note) => note.midi === 64)!;
    const g3 = score.notes.find((note) => note.midi === 55)!;
    const ds4 = score.notes.find((note) => note.midi === 63)!;
    expect(c4.start).toBeCloseTo(0, 6);
    expect(e4.start).toBeCloseTo(0, 6);
    expect(g3.start).toBeCloseTo(0, 6);
    expect(c4.duration).toBeCloseTo(0.5, 6);
    expect(g3.duration).toBeCloseTo(1, 6);
    expect(ds4.start).toBeCloseTo(1.5, 6);
    expect(c4.tieStart).toBe(true);
    expect(ds4.tieStop).toBe(true);
    expect(c4.lyric).toBe('La');
  });

  it('keeps MusicXML parts separate for choir rehearsal', () => {
    const ensemble = importMusicXmlEnsemble(COMPLEX_XML);
    expect(ensemble.parts).toHaveLength(2);
    expect(ensemble.parts.map((part) => part.name)).toEqual(['Soprano', 'Alto']);
    expect(ensemble.parts[0].notes).toHaveLength(4);
    expect(ensemble.parts[1].notes).toHaveLength(1);
  });
});


const ENHARMONIC_XML = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="4.0">
  <part-list><score-part id="P1"><part-name>Pitch spelling</part-name></score-part></part-list>
  <part id="P1"><measure number="1"><attributes><divisions>1</divisions></attributes>
    <note><pitch><step>C</step><alter>-1</alter><octave>4</octave></pitch><duration>1</duration></note>
    <note><pitch><step>B</step><alter>1</alter><octave>3</octave></pitch><duration>1</duration></note>
  </measure></part>
</score-partwise>`;

describe('MusicXML enharmonic spelling', () => {
  it('preserves simple flats and sharps instead of respelling them enharmonically', () => {
    const score = importMusicXml(ENHARMONIC_XML);
    expect(score.notes[0]).toMatchObject({ midi: 59, note: 'C♭', octave: 4 });
    expect(score.notes[1]).toMatchObject({ midi: 60, note: 'B♯', octave: 3 });
  });
});


const REST_XML = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="4.0">
  <part-list><score-part id="P1"><part-name>Rests</part-name></score-part></part-list>
  <part id="P1"><measure number="1"><attributes><divisions>1</divisions></attributes>
    <note><rest/><duration>1</duration></note>
    <note><pitch><step>C</step><octave>4</octave></pitch><duration>1</duration></note>
  </measure></part>
</score-partwise>`;

describe('MusicXML rests', () => {
  it('imports explicit rest events so the score remains complete', () => {
    const score = importMusicXml(REST_XML);
    expect(score.notes).toHaveLength(2);
    expect(score.notes[0].isRest).toBe(true);
    expect(score.notes[1]).toMatchObject({ midi: 60, note: 'C', octave: 4 });
  });
});
