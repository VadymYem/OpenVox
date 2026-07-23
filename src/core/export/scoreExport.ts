import { Midi } from '@tonejs/midi';
import type { MusicalNoteEvent, ScoreDocument } from '../../types';
import { resolveNoteSpelling, synchronizeNotePitch } from '../music/notes';
import { buildNotationTimeline, resolveScoreClef, scoreMeasureCount, scoreTiming } from '../music/scoreModel';
import { renderScoreSvg } from '../music/scoreRenderer';
import { notifySupportOpportunity } from '../support';

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

function durationNotation(value: number): { type: string; dots: number } {
  const options = [
    { value: 6, type: 'whole', dots: 1 },
    { value: 4, type: 'whole', dots: 0 },
    { value: 3, type: 'half', dots: 1 },
    { value: 2, type: 'half', dots: 0 },
    { value: 1.5, type: 'quarter', dots: 1 },
    { value: 1, type: 'quarter', dots: 0 },
    { value: 0.75, type: 'eighth', dots: 1 },
    { value: 0.5, type: 'eighth', dots: 0 },
    { value: 0.375, type: '16th', dots: 1 },
    { value: 0.25, type: '16th', dots: 0 },
    { value: 0.1875, type: '32nd', dots: 1 },
    { value: 0.125, type: '32nd', dots: 0 },
    { value: 0.09375, type: '64th', dots: 1 },
    { value: 0.0625, type: '64th', dots: 0 }
  ];
  return options.reduce((best, candidate) =>
    Math.abs(candidate.value - value) < Math.abs(best.value - value) ? candidate : best
  );
}

function noteXml(
  note: MusicalNoteEvent,
  durationTicks: number,
  durationQuarters: number,
  chord: boolean,
  tieStart: boolean,
  tieStop: boolean,
  measureRest = false,
  tupletStart = false,
  tupletStop = false
): string {
  const notation = measureRest ? { type: 'whole', dots: 0 } : durationNotation(durationQuarters);
  const dots = '<dot/>'.repeat(notation.dots);
  const ties = note.isRest ? '' : `${tieStop ? '<tie type="stop"/>' : ''}${tieStart ? '<tie type="start"/>' : ''}`;
  const notationItems: string[] = [];
  if (!note.isRest) {
    if (tieStop) notationItems.push('<tied type="stop"/>');
    if (tieStart) notationItems.push('<tied type="start"/>');
    if (note.slurStop) notationItems.push('<slur type="stop" number="1"/>');
    if (note.slurStart) notationItems.push('<slur type="start" number="1"/>');
    if (tupletStart) notationItems.push('<tuplet type="start" number="1"/>');
    if (tupletStop) notationItems.push('<tuplet type="stop" number="1"/>');
    if (note.articulation) {
      const articulationXml =
        note.articulation === 'staccato'
          ? '<staccato/>'
          : note.articulation === 'tenuto'
            ? '<tenuto/>'
            : note.articulation === 'accent'
              ? '<accent/>'
              : '<strong-accent type="up"/>';
      notationItems.push(`<articulations>${articulationXml}</articulations>`);
    }
  }
  const notations = notationItems.length ? `<notations>${notationItems.join('')}</notations>` : '';
  const lyric = !note.isRest && note.lyric ? `<lyric><text>${escapeXml(note.lyric)}</text></lyric>` : '';
  const pitchBlock = note.isRest
    ? measureRest
      ? '<rest measure="yes"/>'
      : '<rest/>'
    : (() => {
        const pitch = resolveNoteSpelling(synchronizeNotePitch(note));
        const step = pitch.note.charAt(0);
        const alter = pitch.note.includes('♯') ? 1 : pitch.note.includes('♭') ? -1 : 0;
        return `<pitch><step>${step}</step>${alter ? `<alter>${alter}</alter>` : ''}<octave>${pitch.octave}</octave></pitch>`;
      })();
  const timeModification =
    note.tupletActual && note.tupletNormal
      ? `<time-modification><actual-notes>${note.tupletActual}</actual-notes><normal-notes>${note.tupletNormal}</normal-notes></time-modification>`
      : '';
  return `<note>${chord && !note.isRest ? '<chord/>' : ''}${pitchBlock}<duration>${durationTicks}</duration>${ties}<voice>${note.voice || 1}</voice><type>${notation.type}</type>${dots}${timeModification}${notations}${lyric}</note>`;
}

export function scoreToMusicXml(score: ScoreDocument): string {
  const divisions = 480;
  const timing = scoreTiming(score);
  const beats = Math.max(1, score.timeSignature[0]);
  const beatType = Math.max(1, score.timeSignature[1]);
  const measureTicks = Math.max(1, Math.round(timing.measureBeats * divisions));
  const measureCount = scoreMeasureCount(score);
  const timeline = buildNotationTimeline(score);
  const clef = resolveScoreClef(score);
  const clefSign = clef === 'bass' ? 'F' : 'G';
  const clefLine = clef === 'bass' ? 4 : 2;
  const lastDynamicByVoice = new Map<number, MusicalNoteEvent['dynamic']>();
  const tupletBounds = new Map<string, { first: string; last: string }>();
  const tupletGroups = new Map<string, typeof timeline>();
  timeline.forEach((event) => {
    if (!event.tupletGroupId || event.generated) return;
    const group = tupletGroups.get(event.tupletGroupId) || [];
    group.push(event);
    tupletGroups.set(event.tupletGroupId, group);
  });
  tupletGroups.forEach((group, id) => {
    const ordered = [...group].sort((a, b) => a.start - b.start || a.midi - b.midi);
    if (ordered.length) tupletBounds.set(id, { first: ordered[0].id, last: ordered[ordered.length - 1].id });
  });

  const measures = Array.from({ length: measureCount }, (_, measureIndex) => {
    const attributes =
      measureIndex === 0
        ? `<attributes><divisions>${divisions}</divisions><key><fifths>${score.keyFifths}</fifths></key><time><beats>${beats}</beats><beat-type>${beatType}</beat-type></time><clef><sign>${clefSign}</sign><line>${clefLine}</line></clef></attributes><direction placement="above"><direction-type><metronome><beat-unit>quarter</beat-unit><per-minute>${timing.tempo}</per-minute></metronome></direction-type><sound tempo="${timing.tempo}"/></direction>`
        : '';
    const events = timeline.filter((event) => event.measureIndex === measureIndex);
    const voices = [...new Set(events.map((event) => event.voice || 1))].sort((a, b) => a - b);
    const content: string[] = [];

    voices.forEach((voice, voiceIndex) => {
      if (voiceIndex > 0) content.push(`<backup><duration>${measureTicks}</duration></backup>`);
      const voiceEvents = events.filter((event) => (event.voice || 1) === voice);
      const groups = new Map<number, typeof voiceEvents>();
      voiceEvents.forEach((event) => {
        const startTick = Math.max(0, Math.round(event.startBeatInMeasure * divisions));
        const group = groups.get(startTick) || [];
        group.push(event);
        groups.set(startTick, group);
      });

      let cursor = 0;
      for (const [startTick, group] of [...groups.entries()].sort((a, b) => a[0] - b[0])) {
        if (startTick > cursor) content.push(`<forward><duration>${startTick - cursor}</duration></forward>`);
        const ordered = [...group].sort(
          (a, b) => Number(Boolean(a.isRest)) - Number(Boolean(b.isRest)) || a.midi - b.midi
        );
        const groupDynamic = ordered.find((event) => !event.isRest && event.dynamic)?.dynamic;
        const lastDynamic = lastDynamicByVoice.get(voice);
        if (groupDynamic && groupDynamic !== lastDynamic) {
          content.push(
            `<direction placement="below"><direction-type><dynamics><${groupDynamic}/></dynamics></direction-type><voice>${voice}</voice></direction>`
          );
          lastDynamicByVoice.set(voice, groupDynamic);
        }
        let groupDuration = 0;
        ordered.forEach((event, index) => {
          const durationTicks = Math.max(1, Math.round(event.durationBeats * divisions));
          content.push(
            noteXml(
              event,
              durationTicks,
              event.tupletActual && event.tupletNormal
                ? event.durationBeats * (event.tupletActual / event.tupletNormal)
                : event.durationBeats,
              index > 0 && !event.isRest && !ordered[0].isRest,
              Boolean(event.tieStart),
              Boolean(event.tieStop),
              Boolean(event.measureRest),
              Boolean(event.tupletGroupId && tupletBounds.get(event.tupletGroupId)?.first === event.id),
              Boolean(event.tupletGroupId && tupletBounds.get(event.tupletGroupId)?.last === event.id)
            )
          );
          groupDuration = Math.max(groupDuration, durationTicks);
        });
        cursor = Math.max(cursor, startTick + groupDuration);
      }
      if (cursor < measureTicks) content.push(`<forward><duration>${measureTicks - cursor}</duration></forward>`);
    });

    return `<measure number="${measureIndex + 1}">${attributes}${content.join('')}</measure>`;
  }).join('');

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
    .map(synchronizeNotePitch)
    .sort((a, b) => a.start - b.start)
    .forEach((note) => {
      const dynamicScale: Record<NonNullable<MusicalNoteEvent['dynamic']>, number> = {
        pp: 0.38,
        p: 0.52,
        mp: 0.68,
        mf: 0.82,
        f: 1,
        ff: 1.16
      };
      const articulationScale = note.articulation === 'marcato' ? 1.24 : note.articulation === 'accent' ? 1.14 : 1;
      const durationScale = note.articulation === 'staccato' ? 0.52 : note.articulation === 'tenuto' ? 0.98 : 1;
      const dynamic = note.dynamic ? dynamicScale[note.dynamic] : 1;
      track.addNote({
        midi: note.midi,
        time: note.start,
        duration: Math.max(0.01, note.duration * durationScale),
        velocity: Math.max(0.05, Math.min(1, (note.velocity / 127) * dynamic * articulationScale))
      });
    });
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
