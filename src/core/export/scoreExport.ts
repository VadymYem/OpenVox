import { notifySupportOpportunity } from '../support';
import { Midi } from '@tonejs/midi';
import type { MusicalNoteEvent, ScoreDocument } from '../../types';
import { renderScoreSvg } from '../music/scoreRenderer';
import { resolveNoteSpelling } from '../music/notes';

export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  notifySupportOpportunity();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function escapeXml(value: string): string {
  return value.replace(
    /[<>&"']/g,
    (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[char] || char
  );
}

function noteTypeFromQuarterLength(value: number): string {
  if (value >= 3.5) return 'whole';
  if (value >= 1.5) return 'half';
  if (value >= 0.75) return 'quarter';
  if (value >= 0.375) return 'eighth';
  if (value >= 0.1875) return '16th';
  return '32nd';
}

function noteXml(
  note: MusicalNoteEvent,
  durationTicks: number,
  durationQuarters: number,
  chord: boolean,
  tieStart: boolean,
  tieStop: boolean
): string {
  const ties = note.isRest ? '' : `${tieStop ? '<tie type="stop"/>' : ''}${tieStart ? '<tie type="start"/>' : ''}`;
  const notations =
    !note.isRest && (tieStart || tieStop)
      ? `<notations>${tieStop ? '<tied type="stop"/>' : ''}${tieStart ? '<tied type="start"/>' : ''}</notations>`
      : '';
  const lyric = note.lyric ? `<lyric><text>${escapeXml(note.lyric)}</text></lyric>` : '';
  const pitchBlock = note.isRest
    ? '<rest/>'
    : (() => {
        const pitch = resolveNoteSpelling(note);
        const step = pitch.note.charAt(0);
        const alter = pitch.note.includes('♯') ? 1 : pitch.note.includes('♭') ? -1 : 0;
        return `<pitch><step>${step}</step>${alter ? `<alter>${alter}</alter>` : ''}<octave>${pitch.octave}</octave></pitch>`;
      })();
  return `<note>${chord && !note.isRest ? '<chord/>' : ''}${pitchBlock}<duration>${durationTicks}</duration>${ties}<voice>1</voice><type>${noteTypeFromQuarterLength(durationQuarters)}</type>${notations}${lyric}</note>`;
}

export function scoreToMusicXml(score: ScoreDocument): string {
  const divisions = 480;
  const tempo = Math.max(20, score.tempo || 90);
  const beats = Math.max(1, score.timeSignature[0]);
  const beatType = Math.max(1, score.timeSignature[1]);
  const measureQuarters = beats * (4 / beatType);
  const measureTicks = Math.max(1, Math.round(measureQuarters * divisions));
  const toTicks = (seconds: number) => Math.max(0, Math.round(((seconds * tempo) / 60) * divisions));
  const sorted = [...score.notes].sort((a, b) => a.start - b.start || a.midi - b.midi);
  const endTick = sorted.reduce((max, note) => Math.max(max, toTicks(note.start + note.duration)), 0);
  const measureCount = Math.max(1, Math.ceil((endTick + 1) / measureTicks));
  const measureEvents: Array<
    Array<{ note: MusicalNoteEvent; start: number; duration: number; tieStart: boolean; tieStop: boolean }>
  > = Array.from({ length: measureCount }, () => []);
  const pitched = score.notes.filter((note) => !note.isRest);
  const averageMidi = pitched.length ? pitched.reduce((sum, note) => sum + note.midi, 0) / pitched.length : 64;
  const clefSign = averageMidi < 60 ? 'F' : 'G';
  const clefLine = averageMidi < 60 ? 4 : 2;

  for (const note of sorted) {
    let remaining = Math.max(1, toTicks(note.duration));
    let cursor = toTicks(note.start);
    let segmentIndex = 0;
    while (remaining > 0) {
      const measureIndex = Math.floor(cursor / measureTicks);
      while (measureEvents.length <= measureIndex) measureEvents.push([]);
      const localStart = cursor - measureIndex * measureTicks;
      const available = measureTicks - localStart;
      const duration = Math.min(remaining, available);
      const continues = remaining > duration;
      measureEvents[measureIndex].push({
        note,
        start: localStart,
        duration,
        tieStop: Boolean(note.tieStop) || segmentIndex > 0,
        tieStart: Boolean(note.tieStart) || continues
      });
      remaining -= duration;
      cursor += duration;
      segmentIndex += 1;
    }
  }

  const measures = measureEvents
    .map((events, measureIndex) => {
      const attributes =
        measureIndex === 0
          ? `<attributes><divisions>${divisions}</divisions><key><fifths>${score.keyFifths}</fifths></key><time><beats>${beats}</beats><beat-type>${beatType}</beat-type></time><clef><sign>${clefSign}</sign><line>${clefLine}</line></clef></attributes><direction placement="above"><direction-type><metronome><beat-unit>quarter</beat-unit><per-minute>${tempo}</per-minute></metronome></direction-type><sound tempo="${tempo}"/></direction>`
          : '';
      const groups = new Map<number, typeof events>();
      events
        .sort((a, b) => a.start - b.start || (a.note.isRest ? 1 : 0) - (b.note.isRest ? 1 : 0) || a.note.midi - b.note.midi)
        .forEach((event) => {
          const group = groups.get(event.start) || [];
          group.push(event);
          groups.set(event.start, group);
        });
      let cursor = 0;
      const content: string[] = [];
      for (const [start, group] of [...groups.entries()].sort((a, b) => a[0] - b[0])) {
        if (start > cursor) content.push(`<forward><duration>${start - cursor}</duration></forward>`);
        let groupDuration = 0;
        group.forEach((event, index) => {
          const quarters = event.duration / divisions;
          content.push(noteXml(event.note, event.duration, quarters, index > 0, event.tieStart, event.tieStop));
          groupDuration = Math.max(groupDuration, event.duration);
        });
        cursor = Math.max(cursor, start + groupDuration);
      }
      if (cursor < measureTicks) content.push(`<forward><duration>${measureTicks - cursor}</duration></forward>`);
      return `<measure number="${measureIndex + 1}">${attributes}${content.join('')}</measure>`;
    })
    .join('');

  return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="4.0"><work><work-title>${escapeXml(score.title)}</work-title></work><identification><creator type="composer">${escapeXml(score.composer)}</creator><encoding><software>OpenVox Studio</software></encoding></identification><part-list><score-part id="P1"><part-name>Voice</part-name></score-part></part-list><part id="P1">${measures}</part></score-partwise>`;
}

export function exportMusicXml(score: ScoreDocument): void {
  downloadBlob(
    new Blob([scoreToMusicXml(score)], { type: 'application/vnd.recordare.musicxml+xml' }),
    `${safeName(score.title)}.musicxml`
  );
}

export function exportMidi(score: ScoreDocument): void {
  const midi = new Midi();
  midi.name = score.title;
  midi.header.setTempo(score.tempo);
  midi.header.timeSignatures.push({ ticks: 0, timeSignature: score.timeSignature, measures: 0 });
  const track = midi.addTrack();
  track.name = score.title;
  [...score.notes]
    .filter((note) => !note.isRest)
    .sort((a, b) => a.start - b.start)
    .forEach((note) =>
      track.addNote({
        midi: note.midi,
        time: note.start,
        duration: note.duration,
        velocity: Math.max(0.05, Math.min(1, note.velocity / 127))
      })
    );
  const bytes = midi.toArray();
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  downloadBlob(new Blob([buffer], { type: 'audio/midi' }), `${safeName(score.title)}.mid`);
}

export function exportSvg(score: ScoreDocument): void {
  downloadBlob(new Blob([renderScoreSvg(score)], { type: 'image/svg+xml' }), `${safeName(score.title)}.svg`);
}

export async function exportPng(score: ScoreDocument): Promise<void> {
  const svg = renderScoreSvg(score);
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const image = new Image();
  image.src = url;
  await image.decode();
  const canvas = document.createElement('canvas');
  canvas.width = 1800;
  canvas.height = Math.round((1800 * image.height) / image.width);
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas is unavailable.');
  context.fillStyle = '#fffdf8';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  URL.revokeObjectURL(url);
  const png = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((result) => (result ? resolve(result) : reject(new Error('PNG export failed.'))), 'image/png', 1)
  );
  downloadBlob(png, `${safeName(score.title)}.png`);
}

export function printScore(score: ScoreDocument): void {
  const win = window.open('', '_blank', 'noopener,noreferrer');
  if (!win) throw new Error('Popup blocked.');
  win.document.write(
    `<!doctype html><html><head><title>${escapeXml(score.title)}</title><style>html,body{margin:0;background:white}svg{width:100%;height:auto}@page{size:A4;margin:12mm}</style></head><body>${renderScoreSvg(score, 1200)}<script>window.onload=()=>window.print()</script></body></html>`
  );
  win.document.close();
}

function safeName(value: string): string {
  return (
    value
      .trim()
      .replace(/[^a-z0-9а-яіїєґäöüß_-]+/gi, '_')
      .replace(/^_+|_+$/g, '') || 'OpenVox_Score'
  );
}
