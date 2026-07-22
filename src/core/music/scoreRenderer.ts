import type { MusicalNoteEvent, ScoreDocument } from '../../types';
import { resolveNoteSpelling } from './notes';

const escapeXml = (value: string) =>
  value.replace(
    /[<>&"']/g,
    (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[char] || char
  );

function staffStep(note: MusicalNoteEvent): number {
  const pitch = resolveNoteSpelling(note);
  const letterMap: Record<string, number> = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 };
  return pitch.octave * 7 + (letterMap[pitch.note.charAt(0).toUpperCase()] ?? 0);
}

function noteY(note: MusicalNoteEvent, centerY: number): number {
  // The middle line of a treble staff is B4. Each diatonic staff step is 5 px.
  const b4Step = 4 * 7 + 6;
  return centerY - (staffStep(note) - b4Step) * 5;
}

function accidentalFor(note: MusicalNoteEvent): string {
  const pitch = resolveNoteSpelling(note);
  return pitch.note.includes('♯') ? '♯' : pitch.note.includes('♭') ? '♭' : '';
}

function durationShape(durationBeats: number): { open: boolean; stem: boolean; flags: number } {
  if (durationBeats >= 3.5) return { open: true, stem: false, flags: 0 };
  if (durationBeats >= 1.5) return { open: true, stem: true, flags: 0 };
  if (durationBeats >= 0.75) return { open: false, stem: true, flags: 0 };
  if (durationBeats >= 0.375) return { open: false, stem: true, flags: 1 };
  return { open: false, stem: true, flags: 2 };
}

function drawLedgerLines(fragments: string[], x: number, y: number, staffTop: number): void {
  const staffBottom = staffTop + 40;
  if (y < staffTop - 4) {
    for (let lineY = staffTop - 10; lineY >= y - 2; lineY -= 10)
      fragments.push(
        `<line x1="${x - 11}" y1="${lineY}" x2="${x + 11}" y2="${lineY}" stroke="#332f38" stroke-width="1"/>`
      );
  }
  if (y > staffBottom + 4) {
    for (let lineY = staffBottom + 10; lineY <= y + 2; lineY += 10)
      fragments.push(
        `<line x1="${x - 11}" y1="${lineY}" x2="${x + 11}" y2="${lineY}" stroke="#332f38" stroke-width="1"/>`
      );
  }
}

export function renderScoreSvg(score: ScoreDocument, width = 1200): string {
  const tempo = Math.max(20, score.tempo || 90);
  const beatSeconds = 60 / tempo;
  const quarterBeatsPerMeasure = score.timeSignature[0] * (4 / score.timeSignature[1]);
  const measureSeconds = quarterBeatsPerMeasure * beatSeconds;
  const sortedNotes = [...score.notes].sort((a, b) => a.start - b.start || a.midi - b.midi);
  const endTime = sortedNotes.reduce((max, note) => Math.max(max, note.start + note.duration), 0);
  const measureCount = Math.max(1, Math.ceil((endTime + 0.0001) / measureSeconds));
  const measuresPerSystem = width < 900 ? 3 : 4;
  const systems = Math.max(1, Math.ceil(measureCount / measuresPerSystem));
  const systemHeight = 176;
  const height = 130 + systems * systemHeight;
  const left = 96;
  const right = width - 42;
  const staffWidth = right - left;
  const lineGap = 10;
  const fragments: string[] = [];

  fragments.push(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="${escapeXml(score.title)}">`
  );
  fragments.push('<rect width="100%" height="100%" fill="#fffdf8"/>');
  fragments.push(
    `<text x="${width / 2}" y="42" text-anchor="middle" font-family="Georgia,serif" font-size="28" fill="#16141c">${escapeXml(score.title)}</text>`
  );
  fragments.push(
    `<text x="${width - 50}" y="68" text-anchor="end" font-family="system-ui,sans-serif" font-size="13" fill="#615b6a">${escapeXml(score.composer)}</text>`
  );
  fragments.push(
    `<text x="50" y="68" font-family="system-ui,sans-serif" font-size="13" fill="#615b6a">♩ = ${tempo} · ${score.timeSignature[0]}/${score.timeSignature[1]} · key ${score.keyFifths >= 0 ? '+' : ''}${score.keyFifths}</text>`
  );

  const notePositions = new Map<string, { x: number; y: number; system: number }>();

  for (let system = 0; system < systems; system++) {
    const staffTop = 105 + system * systemHeight;
    for (let line = 0; line < 5; line++) {
      const y = staffTop + line * lineGap;
      fragments.push(`<line x1="${left}" y1="${y}" x2="${right}" y2="${y}" stroke="#332f38" stroke-width="1"/>`);
    }
    fragments.push(
      `<text x="${left - 62}" y="${staffTop + 39}" font-family="serif" font-size="58" fill="#2f2a34">𝄞</text>`
    );
    if (system === 0) {
      fragments.push(
        `<text x="${left - 11}" y="${staffTop + 19}" text-anchor="middle" font-family="Georgia,serif" font-size="17" fill="#2f2a34">${score.timeSignature[0]}</text>`
      );
      fragments.push(
        `<text x="${left - 11}" y="${staffTop + 40}" text-anchor="middle" font-family="Georgia,serif" font-size="17" fill="#2f2a34">${score.timeSignature[1]}</text>`
      );
    }

    const systemStartMeasure = system * measuresPerSystem;
    const measuresInSystem = Math.min(measuresPerSystem, measureCount - systemStartMeasure);
    const measureWidth = staffWidth / measuresInSystem;
    for (let m = 0; m <= measuresInSystem; m++) {
      const x = left + m * measureWidth;
      fragments.push(
        `<line x1="${x}" y1="${staffTop}" x2="${x}" y2="${staffTop + 40}" stroke="#332f38" stroke-width="${m === measuresInSystem ? 1.8 : 1}"/>`
      );
      if (m < measuresInSystem)
        fragments.push(
          `<text x="${x + 6}" y="${staffTop - 8}" font-family="ui-monospace,monospace" font-size="9" fill="#9a929d">${systemStartMeasure + m + 1}</text>`
        );
    }

    const systemNotes = sortedNotes.filter((note) => {
      const measure = Math.min(measureCount - 1, Math.floor(note.start / measureSeconds));
      return Math.floor(measure / measuresPerSystem) === system;
    });

    for (const note of systemNotes) {
      const absoluteMeasure = Math.min(measureCount - 1, Math.floor(note.start / measureSeconds));
      const localMeasure = absoluteMeasure - systemStartMeasure;
      const inMeasure = Math.max(0, note.start - absoluteMeasure * measureSeconds);
      const beatPosition = inMeasure / beatSeconds;
      const x =
        left +
        localMeasure * measureWidth +
        18 +
        (beatPosition / quarterBeatsPerMeasure) * Math.max(20, measureWidth - 36);
      const y = noteY(note, staffTop + 20);
      notePositions.set(note.id, { x, y, system });
      drawLedgerLines(fragments, x, y, staffTop);
      const accidental = accidentalFor(note);
      if (accidental)
        fragments.push(
          `<text x="${x - 19}" y="${y + 6}" font-family="serif" font-size="21" fill="#2f2a34">${accidental}</text>`
        );

      const durationBeats = note.duration / beatSeconds;
      const shape = durationShape(durationBeats);
      fragments.push(
        `<ellipse cx="${x}" cy="${y}" rx="7.5" ry="5.3" transform="rotate(-18 ${x} ${y})" fill="${shape.open ? '#fffdf8' : '#19161d'}" stroke="#19161d" stroke-width="1.8"/>`
      );
      if (shape.stem) {
        const stemUp = y >= staffTop + 20;
        const stemX = stemUp ? x + 6 : x - 6;
        const stemEnd = stemUp ? y - 36 : y + 36;
        fragments.push(
          `<line x1="${stemX}" y1="${y}" x2="${stemX}" y2="${stemEnd}" stroke="#19161d" stroke-width="1.6"/>`
        );
        for (let flag = 0; flag < shape.flags; flag++) {
          const offset = flag * (stemUp ? 8 : -8);
          const direction = stemUp ? 1 : -1;
          fragments.push(
            `<path d="M ${stemX} ${stemEnd + offset} q ${11 * direction} ${6 * direction} ${13 * direction} ${18 * direction}" fill="none" stroke="#19161d" stroke-width="2" stroke-linecap="round"/>`
          );
        }
      }
      if (note.lyric)
        fragments.push(
          `<text x="${x}" y="${staffTop + 83}" text-anchor="middle" font-family="system-ui,sans-serif" font-size="11" fill="#4d4753">${escapeXml(note.lyric)}</text>`
        );
      fragments.push(
        `<text x="${x}" y="${staffTop + 105}" text-anchor="middle" font-family="ui-monospace,monospace" font-size="9" fill="#827a87">${escapeXml(resolveNoteSpelling(note).note)}${resolveNoteSpelling(note).octave}</text>`
      );
    }
  }

  for (let i = 0; i < sortedNotes.length - 1; i++) {
    const note = sortedNotes[i];
    if (!note.tieStart) continue;
    const next = sortedNotes.slice(i + 1).find((candidate) => candidate.midi === note.midi);
    if (!next) continue;
    const a = notePositions.get(note.id);
    const b = notePositions.get(next.id);
    if (!a || !b || a.system !== b.system) continue;
    const midX = (a.x + b.x) / 2;
    const arcY = Math.max(a.y, b.y) + 13;
    fragments.push(
      `<path d="M ${a.x + 7} ${arcY} Q ${midX} ${arcY + 17} ${b.x - 7} ${arcY}" fill="none" stroke="#19161d" stroke-width="1.4"/>`
    );
  }

  fragments.push('</svg>');
  return fragments.join('');
}
