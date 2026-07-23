import { describe, expect, it } from 'vitest';
import { importMusicXml } from '../src/core/music/musicXmlImport';
import { scoreToMusicXml } from '../src/core/export/scoreExport';
import type { ScoreDocument } from '../src/types';
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
      <note><pitch><step>C</step><octave>4</octave></pitch><duration>4</duration><voice>1</voice><tie type="start"/><lyric><text>La</text></lyric></note>
      <note><chord/><pitch><step>E</step><octave>4</octave></pitch><duration>4</duration><voice>1</voice></note>
      <backup><duration>4</duration></backup>
      <note><pitch><step>G</step><octave>3</octave></pitch><duration>8</duration><voice>2</voice></note>
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
    expect(c4.voice).toBe(1);
    expect(e4.voice).toBe(1);
    expect(g3.voice).toBe(2);
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
  <part id="P1"><measure number="1">
    <attributes><divisions>1</divisions><clef><sign>F</sign><line>4</line></clef></attributes>
    <note><rest/><duration>1</duration><type>quarter</type></note>
    <note><pitch><step>C</step><octave>3</octave></pitch><duration>1</duration><type>quarter</type></note>
  </measure></part>
</score-partwise>`;

describe('MusicXML rests and clefs', () => {
  it('imports explicit rests and the written clef', () => {
    const score = importMusicXml(REST_XML);
    expect(score.clef).toBe('bass');
    expect(score.notes).toHaveLength(2);
    expect(score.notes[0].isRest).toBe(true);
    expect(score.notes[1]).toMatchObject({ midi: 48, note: 'C', octave: 3 });
  });
});

const EXPRESSIVE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="4.0">
  <part-list><score-part id="P1"><part-name>Expressive</part-name></score-part></part-list>
  <part id="P1"><measure number="1">
    <attributes><divisions>1</divisions></attributes>
    <direction placement="below"><direction-type><dynamics><mf/></dynamics></direction-type></direction>
    <note>
      <pitch><step>C</step><octave>4</octave></pitch><duration>1</duration>
      <notations><slur type="start" number="1"/><articulations><staccato/></articulations></notations>
    </note>
    <note>
      <pitch><step>D</step><octave>4</octave></pitch><duration>1</duration>
      <notations><slur type="stop" number="1"/><articulations><accent/></articulations></notations>
    </note>
  </measure></part>
</score-partwise>`;

describe('MusicXML expressive notation', () => {
  it('imports dynamics, articulations and slur endpoints', () => {
    const score = importMusicXml(EXPRESSIVE_XML);
    expect(score.notes[0]).toMatchObject({ dynamic: 'mf', articulation: 'staccato', slurStart: true });
    expect(score.notes[1]).toMatchObject({ dynamic: 'mf', articulation: 'accent', slurStop: true });
  });
});


const TUPLET_XML = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="4.0">
  <part-list><score-part id="P1"><part-name>Tuplets</part-name></score-part></part-list>
  <part id="P1"><measure number="1">
    <attributes><divisions>3</divisions><time><beats>4</beats><beat-type>4</beat-type></time></attributes>
    <note><pitch><step>C</step><octave>5</octave></pitch><duration>1</duration><voice>1</voice><type>eighth</type><time-modification><actual-notes>3</actual-notes><normal-notes>2</normal-notes></time-modification><notations><tuplet type="start" number="1"/></notations></note>
    <note><pitch><step>D</step><octave>5</octave></pitch><duration>1</duration><voice>1</voice><type>eighth</type><time-modification><actual-notes>3</actual-notes><normal-notes>2</normal-notes></time-modification></note>
    <note><pitch><step>E</step><octave>5</octave></pitch><duration>1</duration><voice>1</voice><type>eighth</type><time-modification><actual-notes>3</actual-notes><normal-notes>2</normal-notes></time-modification><notations><tuplet type="stop" number="1"/></notations></note>
  </measure></part>
</score-partwise>`;

describe('MusicXML tuplets', () => {
  it('imports tuplet ratios and keeps a shared group id', () => {
    const score = importMusicXml(TUPLET_XML);
    expect(score.notes).toHaveLength(3);
    expect(score.notes.every((event) => event.tupletActual === 3 && event.tupletNormal === 2)).toBe(true);
    expect(new Set(score.notes.map((event) => event.tupletGroupId)).size).toBe(1);
  });

  it('exports time-modification and tuplet boundaries', () => {
    const duration = 1 / 3;
    const score: ScoreDocument = {
      id: 'tuplet-export',
      title: 'Triplet',
      composer: 'OpenVox',
      tempo: 60,
      timeSignature: [4, 4],
      keyFifths: 0,
      notes: [0, 1, 2].map((index) => ({
        id: `t-${index}`,
        midi: 72 + index * 2,
        note: ['C', 'D', 'E'][index],
        octave: 5,
        start: index * duration,
        duration,
        velocity: 96,
        confidence: 1,
        voice: 1,
        tupletActual: 3,
        tupletNormal: 2,
        tupletGroupId: 'triplet-export'
      })),
      createdAt: 0,
      updatedAt: 0
    };
    const xml = scoreToMusicXml(score);
    expect((xml.match(/<time-modification>/g) || []).length).toBe(3);
    expect(xml).toContain('<actual-notes>3</actual-notes>');
    expect(xml).toContain('<normal-notes>2</normal-notes>');
    expect(xml).toContain('<tuplet type="start" number="1"/>');
    expect(xml).toContain('<tuplet type="stop" number="1"/>');
  });
});

describe('MusicXML complete-measure rests', () => {
  it('exports an empty 3/4 measure as a measure rest with whole-rest notation', () => {
    const score: ScoreDocument = {
      id: 'measure-rest-export',
      title: 'Measure rest',
      composer: 'OpenVox',
      tempo: 60,
      timeSignature: [3, 4],
      keyFifths: 0,
      minimumMeasures: 1,
      notes: [],
      createdAt: 0,
      updatedAt: 0
    };
    const xml = scoreToMusicXml(score);
    expect(xml).toContain('<rest measure="yes"/>');
    expect(xml).toContain('<duration>1440</duration>');
    expect(xml).toContain('<type>whole</type>');
  });
});


const EMPTY_MEASURE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="4.0">
  <part-list><score-part id="P1"><part-name>Voice</part-name></score-part></part-list>
  <part id="P1">
    <measure number="1"><attributes><divisions>1</divisions><time><beats>4</beats><beat-type>4</beat-type></time></attributes><note><pitch><step>C</step><octave>4</octave></pitch><duration>1</duration></note></measure>
    <measure number="2"></measure>
    <measure number="3"><note><pitch><step>D</step><octave>4</octave></pitch><duration>1</duration></note></measure>
  </part>
</score-partwise>`;

describe('MusicXML measure structure', () => {
  it('preserves empty measures and does not collapse later notes in time', () => {
    const score = importMusicXml(EMPTY_MEASURE_XML);
    expect(score.minimumMeasures).toBe(3);
    expect(score.notes).toHaveLength(2);
    expect(score.notes[0].start).toBeCloseTo(0, 6);
    expect(score.notes[1].start).toBeCloseTo(8, 6);
  });
});
