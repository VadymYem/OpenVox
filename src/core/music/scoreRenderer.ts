import type { MusicalNoteEvent, ScoreDocument } from '../../types';
import { parseNoteSpelling, resolveNoteSpelling, staffStepForEvent, synchronizeNotePitch } from './notes';
import {
  accidentalSymbolForEvent,
  buildNotationTimeline,
  clefReferenceStep,
  type ConcreteScoreClef,
  resolveScoreClef,
  scoreMeasureCount,
  scoreTiming,
  staffYForEvent
} from './scoreModel';

export interface ScoreRenderOptions {
  selectedEventId?: string | null;
  showPitchLabels?: boolean;
  cursorBeat?: number | null;
}

interface DurationAppearance {
  baseBeats: number;
  dotted: boolean;
  open: boolean;
  stem: boolean;
  flags: number;
}

const escapeXml = (value: string) =>
  value.replace(
    /[<>&"']/g,
    (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[char] || char
  );

function durationAppearance(durationBeats: number): DurationAppearance {
  const bases = [4, 2, 1, 0.5, 0.25, 0.125, 0.0625];
  let best = { baseBeats: 1, dotted: false, distance: Number.POSITIVE_INFINITY };
  for (const base of bases) {
    for (const dotted of [false, true]) {
      const value = base * (dotted ? 1.5 : 1);
      const distance = Math.abs(durationBeats - value);
      if (distance < best.distance) best = { baseBeats: base, dotted, distance };
    }
  }
  return {
    baseBeats: best.baseBeats,
    dotted: best.dotted,
    open: best.baseBeats >= 2,
    stem: best.baseBeats < 4,
    flags: best.baseBeats <= 0.0625 ? 4 : best.baseBeats <= 0.125 ? 3 : best.baseBeats <= 0.25 ? 2 : best.baseBeats <= 0.5 ? 1 : 0
  };
}

function notationDurationBeats(event: { durationBeats: number; tupletActual?: number; tupletNormal?: number }): number {
  if (event.tupletActual && event.tupletNormal) {
    return event.durationBeats * (event.tupletActual / event.tupletNormal);
  }
  return event.durationBeats;
}


interface MeasureSpacingMap {
  anchors: number[];
  positions: number[];
}

function buildMeasureSpacingMap(
  events: ReturnType<typeof buildNotationTimeline>,
  measureIndex: number,
  measureBeats: number
): MeasureSpacingMap {
  const anchors = new Set<number>([0, measureBeats]);
  events
    .filter((event) => event.measureIndex === measureIndex)
    .forEach((event) => {
      anchors.add(Math.max(0, Math.min(measureBeats, event.startBeatInMeasure)));
      anchors.add(Math.max(0, Math.min(measureBeats, event.startBeatInMeasure + event.durationBeats)));
    });
  const ordered = [...anchors].sort((a, b) => a - b).filter((value, index, values) => index === 0 || value - values[index - 1] > 0.000001);
  if (ordered.length < 2) return { anchors: [0, measureBeats], positions: [0, 1] };

  const weights = ordered.slice(0, -1).map((value, index) => {
    const delta = Math.max(0.000001, ordered[index + 1] - value);
    // Square-root spacing is a common engraving compromise: it keeps larger
    // rhythmic spans visibly larger while giving short values enough room for
    // noteheads, accidentals and flags.
    return Math.sqrt(delta);
  });
  const total = weights.reduce((sum, weight) => sum + weight, 0) || 1;
  const positions = [0];
  let cursor = 0;
  weights.forEach((weight) => {
    cursor += weight / total;
    positions.push(cursor);
  });
  positions[positions.length - 1] = 1;
  return { anchors: ordered, positions };
}

function spacingPosition(map: MeasureSpacingMap, beat: number): number {
  const clamped = Math.max(map.anchors[0], Math.min(map.anchors[map.anchors.length - 1], beat));
  for (let index = 0; index < map.anchors.length - 1; index += 1) {
    const start = map.anchors[index];
    const end = map.anchors[index + 1];
    if (clamped <= end + 0.000001) {
      const ratio = end - start <= 0.000001 ? 0 : (clamped - start) / (end - start);
      return map.positions[index] + ratio * (map.positions[index + 1] - map.positions[index]);
    }
  }
  return 1;
}

function drawLedgerLines(fragments: string[], x: number, y: number, staffTop: number): void {
  const staffBottom = staffTop + 40;
  if (y < staffTop - 4) {
    for (let lineY = staffTop - 10; lineY >= y - 2; lineY -= 10) {
      fragments.push(
        `<line x1="${x - 12}" y1="${lineY}" x2="${x + 12}" y2="${lineY}" stroke="#332f38" stroke-width="1.2"/>`
      );
    }
  }
  if (y > staffBottom + 4) {
    for (let lineY = staffBottom + 10; lineY <= y + 2; lineY += 10) {
      fragments.push(
        `<line x1="${x - 12}" y1="${lineY}" x2="${x + 12}" y2="${lineY}" stroke="#332f38" stroke-width="1.2"/>`
      );
    }
  }
}

function drawRest(
  fragments: string[],
  x: number,
  staffTop: number,
  durationBeats: number,
  measureRest: boolean,
  eventId: string,
  sourceId: string,
  generated: boolean,
  selected: boolean,
  voice = 1,
  polyphonic = false
): void {
  const appearance = measureRest ? durationAppearance(4) : durationAppearance(durationBeats);
  const cls = selected ? 'score-event score-event-selected' : 'score-event';
  const voiceOffset = polyphonic ? (voice === 1 || voice === 3 ? -10 : 10) : 0;
  fragments.push(
    `<g class="${cls}" data-event-id="${escapeXml(sourceId)}" data-render-id="${escapeXml(eventId)}" data-event-kind="rest" data-voice="${voice}" data-generated="${generated ? 'true' : 'false'}" pointer-events="${generated ? 'none' : 'auto'}">`
  );

  if (measureRest || appearance.baseBeats >= 4) {
    // Whole / full-measure rest: hangs from the second line from the top.
    fragments.push(`<rect x="${x - 8}" y="${staffTop + 10 + voiceOffset}" width="16" height="5.5" rx="0.8" fill="#19161d"/>`);
  } else if (appearance.baseBeats >= 2) {
    // Half rest: sits on the middle staff line.
    fragments.push(`<rect x="${x - 8}" y="${staffTop + 14.5 + voiceOffset}" width="16" height="5.5" rx="0.8" fill="#19161d"/>`);
  } else if (appearance.baseBeats >= 1) {
    // Quarter rest: a narrow zig-zag body with the characteristic lower hook.
    // It is drawn from SVG strokes instead of a font glyph, so exports are
    // consistent across browsers and devices without turning into tofu boxes.
    const y = staffTop + 20 + voiceOffset;
    fragments.push(
      `<path d="M ${x - 3} ${y - 18} L ${x + 4} ${y - 10} L ${x - 1} ${y - 3} L ${x + 5} ${y + 4} L ${x} ${y + 10}" fill="none" stroke="#19161d" stroke-width="3.15" stroke-linecap="round" stroke-linejoin="round"/>`
    );
    fragments.push(
      `<path d="M ${x} ${y + 10} C ${x + 7} ${y + 7}, ${x + 9} ${y + 14}, ${x + 3} ${y + 17} C ${x - 2} ${y + 20}, ${x - 8} ${y + 15}, ${x - 4} ${y + 11}" fill="none" stroke="#19161d" stroke-width="2.7" stroke-linecap="round"/>`
    );
  } else {
    // Eighth through sixty-fourth rest with one to four flags.
    const y = staffTop + 20 + voiceOffset;
    const flagCount = appearance.flags;
    fragments.push(`<path d="M ${x + 2} ${y - 15} L ${x - 4} ${y + 18}" stroke="#19161d" stroke-width="2.2" stroke-linecap="round"/>`);
    for (let flag = 0; flag < flagCount; flag += 1) {
      const fy = y - 13 + flag * 8;
      fragments.push(`<circle cx="${x - 2}" cy="${fy}" r="4.2" fill="#19161d"/>`);
      fragments.push(
        `<path d="M ${x + 1} ${fy + 1} C ${x + 10} ${fy + 3}, ${x + 10} ${fy + 10}, ${x + 4} ${fy + 14}" fill="none" stroke="#19161d" stroke-width="2.2" stroke-linecap="round"/>`
      );
    }
  }

  if (appearance.dotted && !measureRest) {
    fragments.push(`<circle cx="${x + 14}" cy="${staffTop + 20 + voiceOffset}" r="2" fill="#19161d"/>`);
  }
  fragments.push('</g>');
}

function drawArticulation(
  fragments: string[],
  articulation: MusicalNoteEvent['articulation'],
  x: number,
  y: number,
  stemUp: boolean
): void {
  if (!articulation) return;
  const direction = stemUp ? 1 : -1;
  const markY = y + direction * 15;
  if (articulation === 'staccato') {
    fragments.push(`<circle cx="${x}" cy="${markY}" r="2.4" fill="#19161d" data-articulation="staccato"/>`);
    return;
  }
  if (articulation === 'tenuto') {
    fragments.push(
      `<line x1="${x - 6}" y1="${markY}" x2="${x + 6}" y2="${markY}" stroke="#19161d" stroke-width="1.8" stroke-linecap="round" data-articulation="tenuto"/>`
    );
    return;
  }
  if (articulation === 'accent') {
    const vertical = direction * 4;
    fragments.push(
      `<path d="M ${x - 7} ${markY - vertical} L ${x + 7} ${markY} L ${x - 7} ${markY + vertical}" fill="none" stroke="#19161d" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" data-articulation="accent"/>`
    );
    return;
  }
  const tipY = markY + direction * 5;
  fragments.push(
    `<path d="M ${x - 6} ${markY} L ${x} ${tipY} L ${x + 6} ${markY}" fill="none" stroke="#19161d" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" data-articulation="marcato"/>`
  );
}

function fakeNote(label: string): MusicalNoteEvent {
  const pitch = parseNoteSpelling(label) || { midi: 60, note: 'C', octave: 4 };
  return {
    id: `key-${label}`,
    ...pitch,
    start: 0,
    duration: 1,
    velocity: 1,
    confidence: 1
  };
}

const KEY_POSITIONS: Record<ConcreteScoreClef, { sharps: string[]; flats: string[] }> = {
  treble: {
    sharps: ['F5', 'C5', 'G5', 'D5', 'A4', 'E5', 'B4'],
    flats: ['B4', 'E5', 'A4', 'D5', 'G4', 'C5', 'F4']
  },
  bass: {
    sharps: ['F3', 'C3', 'G3', 'D3', 'A2', 'E3', 'B2'],
    flats: ['B2', 'E3', 'A2', 'D3', 'G2', 'C3', 'F2']
  }
};

function drawKeySignature(
  fragments: string[],
  fifths: number,
  clef: ConcreteScoreClef,
  xStart: number,
  staffTop: number
): number {
  const count = Math.min(7, Math.abs(fifths));
  if (!count) return xStart;
  const sign = fifths > 0 ? '♯' : '♭';
  const labels = fifths > 0 ? KEY_POSITIONS[clef].sharps : KEY_POSITIONS[clef].flats;
  for (let index = 0; index < count; index += 1) {
    const y = staffYForEvent(fakeNote(labels[index]), staffTop + 20, clef);
    fragments.push(
      `<text x="${xStart + index * 14}" y="${y + 6}" text-anchor="middle" font-family="Georgia,'Times New Roman',serif" font-size="25" font-weight="700" fill="#211d25">${sign}</text>`
    );
  }
  return xStart + count * 14;
}

function drawTimeSignature(fragments: string[], x: number, staffTop: number, signature: [number, number]): void {
  fragments.push(
    `<text x="${x}" y="${staffTop + 18}" text-anchor="middle" font-family="Georgia,'Times New Roman',serif" font-size="20" font-weight="700" fill="#211d25">${signature[0]}</text>`
  );
  fragments.push(
    `<text x="${x}" y="${staffTop + 39}" text-anchor="middle" font-family="Georgia,'Times New Roman',serif" font-size="20" font-weight="700" fill="#211d25">${signature[1]}</text>`
  );
}

function drawClef(fragments: string[], clef: ConcreteScoreClef, x: number, staffTop: number): void {
  const glyph = clef === 'treble' ? '𝄞' : '𝄢';
  const y = clef === 'treble' ? staffTop + 39 : staffTop + 35;
  const size = clef === 'treble' ? 58 : 52;
  fragments.push(
    `<text x="${x}" y="${y}" text-anchor="middle" font-family="'Noto Music','Segoe UI Symbol','Arial Unicode MS',serif" font-size="${size}" fill="#2f2a34">${glyph}</text>`
  );
}

interface BeamGroup {
  id: string;
  eventIds: string[];
  stemUp: boolean;
  beamCount: number;
}

interface StemGeometry {
  eventId: string;
  x: number;
  y: number;
  stemX: number;
  stemEnd: number;
  stemUp: boolean;
}

interface ChordLayout {
  representativeId: string;
  events: ReturnType<typeof buildNotationTimeline>;
  stemUp: boolean;
  offsets: Map<string, number>;
  accidentalColumns: Map<string, number>;
}

function buildChordLayouts(
  events: ReturnType<typeof buildNotationTimeline>,
  clef: ConcreteScoreClef,
  polyphonic: boolean
): Map<string, ChordLayout> {
  const groups = new Map<string, ReturnType<typeof buildNotationTimeline>>();
  for (const event of events) {
    if (event.isRest) continue;
    const key = `${event.measureIndex}:${event.voice || 1}:${event.startBeatInMeasure.toFixed(6)}:${event.durationBeats.toFixed(6)}`;
    const group = groups.get(key) || [];
    group.push(event);
    groups.set(key, group);
  }

  const layouts = new Map<string, ChordLayout>();
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    const ordered = [...group].sort((a, b) => staffStepForEvent(a) - staffStepForEvent(b) || a.midi - b.midi);
    const averageStep = ordered.reduce((sum, event) => sum + staffStepForEvent(event), 0) / ordered.length;
    const voice = ordered[0].voice || 1;
    const stemUp = polyphonic ? voice === 1 || voice === 3 : averageStep <= clefReferenceStep(clef);
    const offsets = new Map<string, number>();

    // Seconds need horizontally displaced noteheads. Keep unisons aligned,
    // and alternate only inside consecutive diatonic clusters.
    let clusterStart = 0;
    while (clusterStart < ordered.length) {
      let clusterEnd = clusterStart + 1;
      while (
        clusterEnd < ordered.length &&
        staffStepForEvent(ordered[clusterEnd]) - staffStepForEvent(ordered[clusterEnd - 1]) <= 1
      ) {
        clusterEnd += 1;
      }
      const cluster = ordered.slice(clusterStart, clusterEnd);
      cluster.forEach((event, index) => {
        const shifted = index % 2 === 1;
        offsets.set(event.id, shifted ? (stemUp ? -9 : 9) : 0);
      });
      clusterStart = clusterEnd;
    }

    // Accidentals in close vertical proximity use separate columns so flats,
    // sharps and naturals never collide with each other or the noteheads.
    const accidentalColumns = new Map<string, number>();
    const columns: number[][] = [];
    for (const event of ordered) {
      const step = staffStepForEvent(event);
      let column = columns.findIndex((steps) => steps.every((other) => Math.abs(other - step) >= 3));
      if (column < 0) {
        column = columns.length;
        columns.push([]);
      }
      columns[column].push(step);
      accidentalColumns.set(event.id, column);
    }

    const representativeId = ordered[0].id;
    const layout: ChordLayout = { representativeId, events: ordered, stemUp, offsets, accidentalColumns };
    ordered.forEach((event) => layouts.set(event.id, layout));
  }
  return layouts;
}

function buildBeamGroups(
  events: ReturnType<typeof buildNotationTimeline>,
  score: ScoreDocument,
  clef: ConcreteScoreClef,
  polyphonic: boolean
): BeamGroup[] {
  const pulseBeats = score.timeSignature[1] === 8 && score.timeSignature[0] % 3 === 0 ? 1.5 : 1;
  const groups: BeamGroup[] = [];
  const measureVoiceKeys = [
    ...new Set(events.filter((event) => !event.isRest).map((event) => `${event.measureIndex}:${event.voice || 1}`))
  ];

  for (const key of measureVoiceKeys) {
    const [measureText, voiceText] = key.split(':');
    const measureIndex = Number(measureText);
    const voice = Number(voiceText);
    const shortNotes = events
      .filter(
        (event) =>
          event.measureIndex === measureIndex &&
          (event.voice || 1) === voice &&
          !event.isRest &&
          durationAppearance(notationDurationBeats(event)).flags > 0
      )
      .sort((a, b) => a.startBeatInMeasure - b.startBeatInMeasure || a.midi - b.midi);
    const representatives = shortNotes.filter(
      (event, index) => index === 0 || Math.abs(event.startBeatInMeasure - shortNotes[index - 1].startBeatInMeasure) > 0.00001
    );
    let current: typeof representatives = [];

    const flush = () => {
      if (current.length < 2) {
        current = [];
        return;
      }
      const averageStep = current.reduce((sum, event) => sum + staffStepForEvent(event), 0) / current.length;
      groups.push({
        id: `beam-${measureIndex}-v${voice}-${groups.length}`,
        eventIds: current.map((event) => event.id),
        stemUp: polyphonic ? voice === 1 || voice === 3 : averageStep <= clefReferenceStep(clef),
        beamCount: Math.min(...current.map((event) => durationAppearance(notationDurationBeats(event)).flags))
      });
      current = [];
    };

    for (const event of representatives) {
      if (!current.length) {
        current = [event];
        continue;
      }
      const previous = current[current.length - 1];
      const samePulse =
        Math.floor((previous.startBeatInMeasure + 0.00001) / pulseBeats) ===
        Math.floor((event.startBeatInMeasure + 0.00001) / pulseBeats);
      const connected = event.startBeatInMeasure <= previous.startBeatInMeasure + previous.durationBeats + 0.00001;
      if (!samePulse || !connected) flush();
      current.push(event);
    }
    flush();
  }
  return groups;
}

export function renderScoreSvg(score: ScoreDocument, width = 1200, options: ScoreRenderOptions = {}): string {
  const timing = scoreTiming(score);
  const timeline = buildNotationTimeline(score);
  const polyphonic = new Set(score.notes.filter((event) => !event.isRest).map((event) => event.voice || 1)).size > 1;
  const measureCount = scoreMeasureCount(score);
  const clef = resolveScoreClef(score);
  const measuresPerSystem = width < 760 ? 2 : width < 1050 ? 3 : 4;
  const systems = Math.max(1, Math.ceil(measureCount / measuresPerSystem));
  const systemHeight = 190;
  const height = 120 + systems * systemHeight;
  const staffLeft = 48;
  const staffRight = width - 34;
  const clefX = 76;
  const keyX = 112;
  const keyCount = Math.min(7, Math.abs(score.keyFifths));
  const timeX = keyX + keyCount * 14 + 16;
  const firstMeasureLeft = Math.max(176, timeX + 35);
  const fragments: string[] = [];
  const notePositions = new Map<string, { x: number; y: number; system: number }>();
  const stemPositions = new Map<string, StemGeometry>();
  const spacingByMeasure = new Map<number, MeasureSpacingMap>();
  for (let measureIndex = 0; measureIndex < measureCount; measureIndex += 1) {
    spacingByMeasure.set(measureIndex, buildMeasureSpacingMap(timeline, measureIndex, timing.measureBeats));
  }

  fragments.push(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="${escapeXml(score.title)}">`
  );
  fragments.push('<rect width="100%" height="100%" fill="#fffdf8"/>');
  fragments.push(
    `<text x="${width / 2}" y="38" text-anchor="middle" font-family="Georgia,serif" font-size="27" font-weight="700" fill="#16141c">${escapeXml(score.title)}</text>`
  );
  fragments.push(
    `<text x="${width - 44}" y="66" text-anchor="end" font-family="system-ui,sans-serif" font-size="12" fill="#615b6a">${escapeXml(score.composer)}</text>`
  );
  fragments.push(
    `<text x="${staffLeft}" y="66" font-family="system-ui,sans-serif" font-size="12" fill="#615b6a">♩ = ${timing.tempo}</text>`
  );

  for (let system = 0; system < systems; system += 1) {
    const staffTop = 102 + system * systemHeight;
    const systemStartMeasure = system * measuresPerSystem;
    const measuresInSystem = Math.min(measuresPerSystem, measureCount - systemStartMeasure);
    const measureWidth = (staffRight - firstMeasureLeft) / measuresInSystem;

    for (let line = 0; line < 5; line += 1) {
      const y = staffTop + line * 10;
      fragments.push(`<line x1="${staffLeft}" y1="${y}" x2="${staffRight}" y2="${y}" stroke="#332f38" stroke-width="1.15"/>`);
    }
    drawClef(fragments, clef, clefX, staffTop);
    drawKeySignature(fragments, score.keyFifths, clef, keyX, staffTop);
    drawTimeSignature(fragments, timeX, staffTop, score.timeSignature);

    const accidentalStates = new Map<number, Map<string, -1 | 0 | 1>>();

    const cursorBeat = options.cursorBeat;
    if (cursorBeat !== undefined && cursorBeat !== null && cursorBeat >= 0) {
      const cursorMeasure = Math.floor(cursorBeat / timing.measureBeats);
      if (cursorMeasure >= systemStartMeasure && cursorMeasure < systemStartMeasure + measuresInSystem) {
        const localMeasure = cursorMeasure - systemStartMeasure;
        const measureX = firstMeasureLeft + localMeasure * measureWidth;
        const localBeat = cursorBeat - cursorMeasure * timing.measureBeats;
        const spacing = spacingByMeasure.get(cursorMeasure) || { anchors: [0, timing.measureBeats], positions: [0, 1] };
        const cursorX = measureX + 18 + spacingPosition(spacing, localBeat) * Math.max(24, measureWidth - 36);
        fragments.push(
          `<line x1="${cursorX}" y1="${staffTop - 18}" x2="${cursorX}" y2="${staffTop + 58}" stroke="#b89045" stroke-width="1.5" stroke-dasharray="4 4" opacity="0.85" data-score-cursor="true"/>`
        );
        fragments.push(`<circle cx="${cursorX}" cy="${staffTop - 21}" r="3.5" fill="#b89045"/>`);
      }
    }

    for (let localMeasure = 0; localMeasure < measuresInSystem; localMeasure += 1) {
      const measureIndex = systemStartMeasure + localMeasure;
      const xStart = firstMeasureLeft + localMeasure * measureWidth;
      const xEnd = xStart + measureWidth;
      fragments.push(
        (() => {
          const spacing = spacingByMeasure.get(measureIndex) || { anchors: [0, timing.measureBeats], positions: [0, 1] };
          return `<rect x="${xStart}" y="${staffTop - 34}" width="${measureWidth}" height="112" fill="#ffffff" fill-opacity="0" pointer-events="all" data-score-hitbox="true" data-measure-index="${measureIndex}" data-system-index="${system}" data-measure-x="${xStart}" data-measure-width="${measureWidth}" data-staff-top="${staffTop}" data-beat-anchors="${spacing.anchors.map((value) => value.toFixed(6)).join(',')}" data-beat-positions="${spacing.positions.map((value) => value.toFixed(6)).join(',')}"/>`;
        })()
      );
      fragments.push(
        `<line x1="${xStart}" y1="${staffTop}" x2="${xStart}" y2="${staffTop + 40}" stroke="#332f38" stroke-width="${localMeasure === 0 ? 1.4 : 1}"/>`
      );
      if (localMeasure === measuresInSystem - 1) {
        fragments.push(
          `<line x1="${xEnd}" y1="${staffTop}" x2="${xEnd}" y2="${staffTop + 40}" stroke="#332f38" stroke-width="1.8"/>`
        );
      }
      fragments.push(
        `<text x="${xStart + 7}" y="${staffTop - 9}" font-family="ui-monospace,monospace" font-size="9" fill="#9a929d">${measureIndex + 1}</text>`
      );
      accidentalStates.set(measureIndex, new Map());
    }

    const systemEvents = timeline.filter((event) => Math.floor(event.measureIndex / measuresPerSystem) === system);
    const beamGroups = buildBeamGroups(systemEvents, score, clef, polyphonic);
    const beamByEventId = new Map<string, BeamGroup>();
    beamGroups.forEach((group) => group.eventIds.forEach((eventId) => beamByEventId.set(eventId, group)));
    const chordLayouts = buildChordLayouts(systemEvents, clef, polyphonic);
    for (const event of systemEvents) {
      const localMeasure = event.measureIndex - systemStartMeasure;
      const measureX = firstMeasureLeft + localMeasure * measureWidth;
      const innerPadding = 18;
      const usableWidth = Math.max(24, measureWidth - innerPadding * 2);
      const spacing = spacingByMeasure.get(event.measureIndex) || { anchors: [0, timing.measureBeats], positions: [0, 1] };
      const x = measureX + innerPadding + spacingPosition(spacing, event.startBeatInMeasure) * usableWidth;
      const selected = Boolean(options.selectedEventId && options.selectedEventId === event.sourceId);

      if (event.isRest) {
        const restX = event.measureRest ? measureX + measureWidth / 2 : x;
        drawRest(
          fragments,
          restX,
          staffTop,
          notationDurationBeats(event),
          Boolean(event.measureRest),
          event.id,
          event.sourceId,
          Boolean(event.generated),
          selected,
          event.voice || 1,
          polyphonic
        );
        continue;
      }

      const chordLayout = chordLayouts.get(event.id);
      const noteheadOffset = chordLayout?.offsets.get(event.id) || 0;
      const noteX = x + noteheadOffset;
      const y = staffYForEvent(event, staffTop + 20, clef);
      notePositions.set(event.id, { x: noteX, y, system });
      drawLedgerLines(fragments, noteX, y, staffTop);
      const accidentalState = accidentalStates.get(event.measureIndex) || new Map<string, -1 | 0 | 1>();
      const accidental = accidentalSymbolForEvent(event, score.keyFifths, accidentalState);
      const appearance = durationAppearance(notationDurationBeats(event));
      const cls = selected ? 'score-event score-event-selected' : 'score-event';

      fragments.push(
        `<g class="${cls}" data-event-id="${escapeXml(event.sourceId)}" data-render-id="${escapeXml(event.id)}" data-event-kind="note" data-voice="${event.voice || 1}">`
      );
      if (accidental) {
        const accidentalColumn = chordLayout?.accidentalColumns.get(event.id) || 0;
        const accidentalX = noteX - 25 - accidentalColumn * 13;
        fragments.push(
          `<text x="${accidentalX}" y="${y + 7}" text-anchor="middle" font-family="Georgia,'Times New Roman',serif" font-size="24" font-weight="700" fill="#211d25">${accidental}</text>`
        );
      }
      fragments.push(
        `<ellipse cx="${noteX}" cy="${y}" rx="7.7" ry="5.35" transform="rotate(-18 ${noteX} ${y})" fill="${appearance.open ? '#fffdf8' : '#19161d'}" stroke="#19161d" stroke-width="1.8"/>`
      );
      const shouldDrawStem = appearance.stem && (!chordLayout || chordLayout.representativeId === event.id);
      if (shouldDrawStem) {
        const representativeId = chordLayout?.representativeId || event.id;
        const beamGroup = beamByEventId.get(representativeId);
        const eventVoice = event.voice || 1;
        const stemUp =
          beamGroup?.stemUp ??
          chordLayout?.stemUp ??
          (polyphonic ? eventVoice === 1 || eventVoice === 3 : y >= staffTop + 20);
        const chordGeometry = chordLayout
          ? chordLayout.events.map((chordEvent) => ({
              x: x + (chordLayout.offsets.get(chordEvent.id) || 0),
              y: staffYForEvent(chordEvent, staffTop + 20, clef)
            }))
          : [{ x: noteX, y }];
        const stemX = stemUp
          ? Math.max(...chordGeometry.map((point) => point.x)) + 6.2
          : Math.min(...chordGeometry.map((point) => point.x)) - 6.2;
        const stemStart = stemUp
          ? Math.max(...chordGeometry.map((point) => point.y))
          : Math.min(...chordGeometry.map((point) => point.y));
        const stemEnd = stemUp
          ? Math.min(...chordGeometry.map((point) => point.y)) - 36
          : Math.max(...chordGeometry.map((point) => point.y)) + 36;
        fragments.push(
          `<line x1="${stemX}" y1="${stemStart}" x2="${stemX}" y2="${stemEnd}" stroke="#19161d" stroke-width="1.7" stroke-linecap="round" data-stem-direction="${stemUp ? 'up' : 'down'}" data-voice="${event.voice || 1}"${chordLayout ? ' data-chord-stem="true"' : ''}/>`
        );
        stemPositions.set(representativeId, {
          eventId: representativeId,
          x,
          y: stemStart,
          stemX,
          stemEnd,
          stemUp
        });
        const firstIndependentFlag = beamGroup ? beamGroup.beamCount : 0;
        for (let flag = firstIndependentFlag; flag < appearance.flags; flag += 1) {
          const offset = (flag - firstIndependentFlag) * (stemUp ? 7 : -7);
          if (stemUp) {
            fragments.push(
              `<path d="M ${stemX} ${stemEnd + offset} C ${stemX + 14} ${stemEnd + 4 + offset}, ${stemX + 13} ${stemEnd + 14 + offset}, ${stemX + 5} ${stemEnd + 20 + offset}" fill="none" stroke="#19161d" stroke-width="2" stroke-linecap="round"/>`
            );
          } else {
            fragments.push(
              `<path d="M ${stemX} ${stemEnd + offset} C ${stemX - 14} ${stemEnd - 4 + offset}, ${stemX - 13} ${stemEnd - 14 + offset}, ${stemX - 5} ${stemEnd - 20 + offset}" fill="none" stroke="#19161d" stroke-width="2" stroke-linecap="round"/>`
            );
          }
        }
      }
      if (appearance.dotted) {
        const onStaffLine = Math.abs((y - staffTop) / 10 - Math.round((y - staffTop) / 10)) < 0.05;
        const dotY = onStaffLine ? y - 5 : y;
        fragments.push(`<circle cx="${noteX + 14}" cy="${dotY}" r="2" fill="#19161d"/>`);
      }
      const articulationVoice = event.voice || 1;
      const articulationStemUp =
        beamByEventId.get(chordLayout?.representativeId || event.id)?.stemUp ??
        chordLayout?.stemUp ??
        (polyphonic ? articulationVoice === 1 || articulationVoice === 3 : y >= staffTop + 20);
      drawArticulation(fragments, event.articulation, noteX, y, articulationStemUp);
      const chordLowestY = chordLayout
        ? Math.max(...chordLayout.events.map((chordEvent) => staffYForEvent(chordEvent, staffTop + 20, clef)))
        : y;
      const dynamicY = Math.max(staffTop + 66, chordLowestY + 28);
      if (event.dynamic && (!chordLayout || chordLayout.representativeId === event.id)) {
        fragments.push(
          `<text x="${x}" y="${dynamicY}" text-anchor="middle" font-family="Georgia,'Times New Roman',serif" font-size="18" font-style="italic" font-weight="700" fill="#28232d" data-dynamic="${event.dynamic}">${event.dynamic}</text>`
        );
      }
      if (event.lyric) {
        const lyricY = Math.max(staffTop + 77, chordLowestY + 42, event.dynamic ? dynamicY + 18 : 0);
        fragments.push(
          `<text x="${x}" y="${lyricY}" text-anchor="middle" font-family="system-ui,sans-serif" font-size="11" fill="#4d4753">${escapeXml(event.lyric)}</text>`
        );
      }
      if (options.showPitchLabels) {
        const pitch = resolveNoteSpelling(synchronizeNotePitch(event));
        fragments.push(
          `<text x="${x}" y="${staffTop + 96}" text-anchor="middle" font-family="ui-monospace,monospace" font-size="9" fill="#827a87">${escapeXml(pitch.note)}${pitch.octave}</text>`
        );
      }
      fragments.push('</g>');
    }

    for (const group of beamGroups) {
      const stems = group.eventIds.map((id) => stemPositions.get(id)).filter((stem): stem is StemGeometry => Boolean(stem));
      if (stems.length < 2) continue;
      const first = stems[0];
      const last = stems[stems.length - 1];
      const span = Math.max(1, last.stemX - first.stemX);
      const beamYAt = (x: number) => first.stemEnd + ((x - first.stemX) / span) * (last.stemEnd - first.stemEnd);
      stems.forEach((stem) => {
        const targetY = beamYAt(stem.stemX);
        if (Math.abs(targetY - stem.stemEnd) > 0.5) {
          fragments.push(
            `<line x1="${stem.stemX}" y1="${stem.stemEnd}" x2="${stem.stemX}" y2="${targetY}" stroke="#19161d" stroke-width="1.7"/>`
          );
        }
      });
      for (let beam = 0; beam < group.beamCount; beam += 1) {
        const offset = beam * (group.stemUp ? 7 : -7);
        fragments.push(
          `<line x1="${first.stemX}" y1="${first.stemEnd + offset}" x2="${last.stemX}" y2="${last.stemEnd + offset}" stroke="#19161d" stroke-width="5" stroke-linecap="butt"/>`
        );
      }
    }
  }

  const tupletGroups = new Map<string, typeof timeline>();
  timeline.forEach((event) => {
    if (!event.tupletGroupId || event.generated) return;
    const group = tupletGroups.get(event.tupletGroupId) || [];
    group.push(event);
    tupletGroups.set(event.tupletGroupId, group);
  });
  tupletGroups.forEach((group, groupId) => {
    const positioned = group
      .filter((event) => !event.isRest)
      .map((event) => ({ event, position: notePositions.get(event.id) }))
      .filter((item): item is { event: (typeof group)[number]; position: { x: number; y: number; system: number } } => Boolean(item.position))
      .sort((a, b) => a.event.start - b.event.start || a.event.midi - b.event.midi);
    if (positioned.length < 2) return;
    const first = positioned[0];
    const last = positioned[positioned.length - 1];
    if (first.position.system !== last.position.system) return;
    const left = first.position.x - 5;
    const right = last.position.x + 5;
    const y = Math.min(...positioned.map((item) => item.position.y)) - 48;
    const actual = group[0].tupletActual || 3;
    fragments.push(
      `<path d="M ${left} ${y + 7} L ${left} ${y} L ${right} ${y} L ${right} ${y + 7}" fill="none" stroke="#19161d" stroke-width="1.2" data-score-tuplet="${escapeXml(groupId)}"/>`
    );
    fragments.push(
      `<rect x="${(left + right) / 2 - 9}" y="${y - 8}" width="18" height="15" rx="4" fill="#fffdf8"/>`
    );
    fragments.push(
      `<text x="${(left + right) / 2}" y="${y + 4}" text-anchor="middle" font-family="Georgia,'Times New Roman',serif" font-size="13" font-weight="700" fill="#19161d">${actual}</text>`
    );
  });

  const pitchedTimeline = timeline.filter((event) => !event.isRest && !event.generated);
  for (let index = 0; index < pitchedTimeline.length - 1; index += 1) {
    const event = pitchedTimeline[index];
    if (!event.tieStart) continue;
    const next = pitchedTimeline.slice(index + 1).find((candidate) => candidate.midi === event.midi);
    if (!next) continue;
    const a = notePositions.get(event.id);
    const b = notePositions.get(next.id);
    if (!a || !b || a.system !== b.system) continue;
    const midX = (a.x + b.x) / 2;
    const arcY = Math.max(a.y, b.y) + 14;
    fragments.push(
      `<path d="M ${a.x + 7} ${arcY} Q ${midX} ${arcY + 16} ${b.x - 7} ${arcY}" fill="none" stroke="#19161d" stroke-width="1.5" data-score-tie="true"/>`
    );
  }

  for (let index = 0; index < pitchedTimeline.length - 1; index += 1) {
    const event = pitchedTimeline[index];
    if (!event.slurStart) continue;
    const next =
      pitchedTimeline.slice(index + 1).find((candidate) => candidate.slurStop) || pitchedTimeline[index + 1];
    if (!next) continue;
    const a = notePositions.get(event.id);
    const b = notePositions.get(next.id);
    if (!a || !b || a.system !== b.system) continue;
    const midX = (a.x + b.x) / 2;
    const above = (a.y + b.y) / 2 >= 122;
    const startY = above ? Math.min(a.y, b.y) - 10 : Math.max(a.y, b.y) + 12;
    const controlY = startY + (above ? -24 : 24);
    fragments.push(
      `<path d="M ${a.x + 4} ${startY} Q ${midX} ${controlY} ${b.x - 4} ${startY}" fill="none" stroke="#19161d" stroke-width="1.6" stroke-linecap="round" data-score-slur="true"/>`
    );
  }

  fragments.push('</svg>');
  return fragments.join('');
}
