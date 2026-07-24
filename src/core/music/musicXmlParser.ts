import type { MusicalNoteEvent, ScoreClef, ScoreVoice } from '../../types';
import { midiToNote } from './notes';

const STEP_TO_PC: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

export interface ParsedMusicXmlPart {
  id: string;
  name: string;
  notes: MusicalNoteEvent[];
}

export interface ParsedMusicXmlDocument {
  title: string;
  composer: string;
  tempo: number;
  timeSignature: [number, number];
  keyFifths: number;
  clef?: ScoreClef;
  measureCount: number;
  parts: ParsedMusicXmlPart[];
}

function numberText(element: Element | null, fallback: number) {
  const value = Number(element?.textContent?.trim());
  return Number.isFinite(value) ? value : fallback;
}

function directChildren(element: Element, tagName: string) {
  return Array.from(element.children).filter((child) => child.localName === tagName);
}

function parsePart(
  partNode: Element,
  name: string,
  tempo: number,
  initialTimeSignature: [number, number]
): ParsedMusicXmlPart {
  const quarterSeconds = 60 / Math.max(1, tempo);
  let divisions = 480;
  let absoluteSeconds = 0;
  let currentDynamic: MusicalNoteEvent['dynamic'];
  let currentBeats = Math.max(1, initialTimeSignature[0]);
  let currentBeatType = Math.max(1, initialTimeSignature[1]);
  const notes: MusicalNoteEvent[] = [];

  for (const measure of directChildren(partNode, 'measure')) {
    let cursorUnits = 0;
    let furthestUnits = 0;
    let lastNoteStartUnits = 0;
    let activeTuplet: { id: string; actual: number; normal: number; remaining: number } | null = null;
    let hasExplicitCursorMovement = false;

    for (const child of Array.from(measure.children)) {
      if (child.localName === 'attributes') {
        const nextDivisions = numberText(child.querySelector('divisions'), divisions);
        if (nextDivisions > 0) divisions = nextDivisions;
        const nextBeats = numberText(child.querySelector('time > beats'), currentBeats);
        const nextBeatType = numberText(child.querySelector('time > beat-type'), currentBeatType);
        if (nextBeats > 0) currentBeats = nextBeats;
        if (nextBeatType > 0) currentBeatType = nextBeatType;
        continue;
      }

      if (child.localName === 'direction') {
        const dynamicName = child.querySelector('direction-type > dynamics')?.firstElementChild?.localName;
        if (dynamicName && ['pp', 'p', 'mp', 'mf', 'f', 'ff'].includes(dynamicName)) {
          currentDynamic = dynamicName as MusicalNoteEvent['dynamic'];
        }
        continue;
      }

      if (child.localName === 'backup') {
        hasExplicitCursorMovement = true;
        cursorUnits = Math.max(0, cursorUnits - numberText(child.querySelector('duration'), 0));
        continue;
      }

      if (child.localName === 'forward') {
        hasExplicitCursorMovement = true;
        cursorUnits += Math.max(0, numberText(child.querySelector('duration'), 0));
        furthestUnits = Math.max(furthestUnits, cursorUnits);
        continue;
      }

      if (child.localName !== 'note') continue;

      const durationUnits = Math.max(0, numberText(child.querySelector('duration'), divisions));
      const duration = Math.max(0.025, (durationUnits / divisions) * quarterSeconds);
      const chord = Boolean(child.querySelector(':scope > chord'));
      const startUnits = chord ? lastNoteStartUnits : cursorUnits;
      if (!chord) lastNoteStartUnits = startUnits;

      const voice = Math.max(1, Math.min(4, Math.round(numberText(child.querySelector(':scope > voice'), 1)))) as ScoreVoice;
      const actualNotes = Math.round(numberText(child.querySelector('time-modification > actual-notes'), 0));
      const normalNotes = Math.round(numberText(child.querySelector('time-modification > normal-notes'), 0));
      const hasTuplet = actualNotes > 1 && normalNotes > 0;
      const tupletStart = Boolean(child.querySelector('notations > tuplet[type="start"]'));
      const tupletStop = Boolean(child.querySelector('notations > tuplet[type="stop"]'));
      if (
        hasTuplet &&
        (tupletStart || !activeTuplet || activeTuplet.actual !== actualNotes || activeTuplet.normal !== normalNotes)
      ) {
        activeTuplet = {
          id: `tuplet-${crypto.randomUUID()}`,
          actual: actualNotes,
          normal: normalNotes,
          remaining: actualNotes
        };
      }
      const tupletData = hasTuplet && activeTuplet
        ? {
            tupletActual: actualNotes,
            tupletNormal: normalNotes,
            tupletGroupId: activeTuplet.id
          }
        : {};
      if (hasTuplet && activeTuplet) {
        activeTuplet.remaining -= 1;
        if (tupletStop || activeTuplet.remaining <= 0) activeTuplet = null;
      }
      const isRest = Boolean(child.querySelector(':scope > rest'));
      if (isRest) {
        notes.push({
          id: crypto.randomUUID(),
          midi: 60,
          note: 'C',
          octave: 4,
          start: absoluteSeconds + (startUnits / divisions) * quarterSeconds,
          duration,
          velocity: 1,
          confidence: 1,
          isRest: true,
          voice,
          ...tupletData
        });
      } else {
        const step = child.querySelector('pitch > step')?.textContent?.trim().toUpperCase() || 'C';
        const alter = numberText(child.querySelector('pitch > alter'), 0);
        const octave = numberText(child.querySelector('pitch > octave'), 4);
        const pitchClass = STEP_TO_PC[step] ?? 0;
        const midi = Math.max(0, Math.min(127, Math.round((octave + 1) * 12 + pitchClass + alter)));
        const fallback = midiToNote(midi, alter < 0);
        const preserveSimpleSpelling = Number.isInteger(alter) && Math.abs(alter) <= 1;
        const spelledNote = preserveSimpleSpelling ? `${step}${alter === 1 ? '♯' : alter === -1 ? '♭' : ''}` : fallback.note;
        const spelledOctave = preserveSimpleSpelling ? octave : fallback.octave;
        const velocity = Math.max(1, Math.min(127, Math.round(numberText(child.querySelector('velocity'), 96))));
        const articulations = child.querySelector('notations > articulations');
        const articulation: MusicalNoteEvent['articulation'] = articulations?.querySelector('staccato')
          ? 'staccato'
          : articulations?.querySelector('tenuto')
            ? 'tenuto'
            : articulations?.querySelector('accent')
              ? 'accent'
              : articulations?.querySelector('strong-accent')
                ? 'marcato'
                : undefined;

        notes.push({
          id: crypto.randomUUID(),
          midi,
          note: spelledNote,
          octave: spelledOctave,
          start: absoluteSeconds + (startUnits / divisions) * quarterSeconds,
          duration,
          velocity,
          confidence: 1,
          voice,
          lyric: child.querySelector('lyric > text')?.textContent?.trim() || undefined,
          tieStart: Boolean(child.querySelector('tie[type="start"], tied[type="start"]')),
          tieStop: Boolean(child.querySelector('tie[type="stop"], tied[type="stop"]')),
          slurStart: Boolean(child.querySelector('slur[type="start"]')),
          slurStop: Boolean(child.querySelector('slur[type="stop"]')),
          articulation,
          dynamic: currentDynamic,
          ...tupletData
        });
      }

      if (!chord) cursorUnits += durationUnits;
      furthestUnits = Math.max(furthestUnits, startUnits + durationUnits, cursorUnits);
    }

    const nominalMeasureUnits = currentBeats * (4 / currentBeatType) * divisions;
    const implicitMeasure = measure.getAttribute('implicit') === 'yes';
    const elapsedUnits = implicitMeasure || hasExplicitCursorMovement
      ? furthestUnits
      : Math.max(furthestUnits, nominalMeasureUnits);
    if (elapsedUnits > 0) absoluteSeconds += (elapsedUnits / divisions) * quarterSeconds;
  }

  return {
    id: partNode.getAttribute('id') || crypto.randomUUID(),
    name,
    notes: notes.sort((a, b) => a.start - b.start || a.midi - b.midi)
  };
}

export function parseMusicXml(text: string): ParsedMusicXmlDocument {
  const doc = new DOMParser().parseFromString(text, 'application/xml');
  if (doc.querySelector('parsererror')) throw new Error('The MusicXML file could not be parsed.');

  const root = doc.documentElement;
  if (!root || !['score-partwise', 'partwise'].includes(root.localName)) {
    throw new Error('Only partwise MusicXML scores are currently supported.');
  }

  const title =
    doc.querySelector('work-title')?.textContent?.trim() ||
    doc.querySelector('movement-title')?.textContent?.trim() ||
    'Imported score';
  const composer = doc.querySelector('creator[type="composer"]')?.textContent?.trim() || 'OpenVox Studio';
  const tempoNode = doc.querySelector('sound[tempo]');
  const tempoFromSound = Number(tempoNode?.getAttribute('tempo'));
  const tempo = Math.max(
    1,
    Number.isFinite(tempoFromSound) && tempoFromSound > 0
      ? tempoFromSound
      : numberText(doc.querySelector('per-minute'), 60)
  );
  const beats = Math.max(1, numberText(doc.querySelector('time > beats'), 4));
  const beatType = Math.max(1, numberText(doc.querySelector('time > beat-type'), 4));
  const keyFifths = Math.max(-7, Math.min(7, numberText(doc.querySelector('key > fifths'), 0)));
  const clefSign = doc.querySelector('clef > sign')?.textContent?.trim().toUpperCase();
  const clef: ScoreClef | undefined = clefSign === 'F' ? 'bass' : clefSign === 'G' ? 'treble' : undefined;

  const partNames = new Map<string, string>();
  Array.from(doc.querySelectorAll('part-list > score-part')).forEach((node, index) => {
    const id = node.getAttribute('id') || `P${index + 1}`;
    partNames.set(id, node.querySelector('part-name')?.textContent?.trim() || `Part ${index + 1}`);
  });

  const partNodes = Array.from(root.children).filter((child) => child.localName === 'part');
  const measureCount = Math.max(1, ...partNodes.map((partNode) => directChildren(partNode, 'measure').length));
  const parts = partNodes
    .map((partNode, index) => {
      const id = partNode.getAttribute('id') || `P${index + 1}`;
      return parsePart(partNode, partNames.get(id) || `Part ${index + 1}`, tempo, [beats, beatType]);
    })
    .filter((part) => part.notes.length);

  if (!parts.length) throw new Error('No notes or rests were found in the MusicXML score.');

  return {
    title,
    composer,
    tempo,
    timeSignature: [beats, beatType],
    keyFifths,
    clef,
    measureCount,
    parts
  };
}
