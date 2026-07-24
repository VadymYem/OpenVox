import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../app/AppContext';
import { Icon } from '../components/Icon';
import { Seo } from '../components/Seo';
import { ScoreViewport, type ScoreStaffPointer } from '../components/ScoreViewport';
import { exportMidi, exportMusicXml, exportPng, exportSvg, printScore } from '../core/export/scoreExport';
import { importMidi } from '../core/music/midiImport';
import { importMusicXml } from '../core/music/musicXmlImport';
import { midiToNote, noteAccidental, parseNoteSpelling, synchronizeNotePitch } from '../core/music/notes';
import {
  KEY_SIGNATURE_LABELS,
  keySignatureAccidentalForLetter,
  pitchForStaffY,
  quarterBeatsToSeconds,
  resolveScoreClef,
  SCORE_DURATION_CHOICES,
  scoreMeasureCount,
  scoreTiming,
  secondsToQuarterBeats,
  validateScoreRhythm
} from '../core/music/scoreModel';
import { renderScoreSvg } from '../core/music/scoreRenderer';
import { TonePlayer } from '../core/music/player';
import { useI18n } from '../i18n/I18nContext';
import { proText } from '../i18n/proTranslations';
import type { MusicalNoteEvent, ScoreArticulation, ScoreDocument, ScoreDynamic, ScoreVoice } from '../types';

const EPSILON = 0.00001;

type EntryMode = 'note' | 'rest';
type AccidentalChoice = 'key' | 'natural' | 'sharp' | 'flat';
type QuantizeGrid = 'quarter' | 'eighth' | 'triplet' | 'sixteenth';
type TupletRatio = 'none' | '3:2' | '5:4';

function ScoreDurationIcon({ beats }: { beats: number }) {
  const open = beats >= 2;
  const stem = beats < 4;
  const flags = beats <= 0.0625 ? 4 : beats <= 0.125 ? 3 : beats <= 0.25 ? 2 : beats <= 0.5 ? 1 : 0;
  return (
    <svg className="score-duration-icon" viewBox="0 0 28 34" aria-hidden="true">
      <ellipse
        cx="11"
        cy="24"
        rx="6.2"
        ry="4.2"
        transform="rotate(-18 11 24)"
        fill={open ? 'none' : 'currentColor'}
        stroke="currentColor"
        strokeWidth="1.8"
      />
      {stem && <line x1="16" y1="23" x2="16" y2="5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />}
      {Array.from({ length: flags }, (_, index) => (
        <path
          key={index}
          d={`M 16 ${5 + index * 5} C 25 ${8 + index * 5}, 24 ${15 + index * 5}, 18 ${18 + index * 5}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}

function cloneScore(value: ScoreDocument): ScoreDocument {
  return {
    ...value,
    timeSignature: [...value.timeSignature] as [number, number],
    notes: value.notes.map((note) => ({ ...note }))
  };
}

export function ScorePage() {
  const { t, language } = useI18n();
  const x = (key: string) => proText(language, key);
  const { project, setProject, persistProject } = useApp();
  const [message, setMessage] = useState('');
  const [playing, setPlaying] = useState(false);
  const [mobilePane, setMobilePane] = useState<'edit' | 'preview'>('edit');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [entryMode, setEntryMode] = useState<EntryMode>('note');
  const [durationBeats, setDurationBeats] = useState<number>(1);
  const [dotted, setDotted] = useState(false);
  const [tupletRatio, setTupletRatio] = useState<TupletRatio>('none');
  const [accidental, setAccidental] = useState<AccidentalChoice>('key');
  const [entryArticulation, setEntryArticulation] = useState<ScoreArticulation | 'none'>('none');
  const [entryDynamic, setEntryDynamic] = useState<ScoreDynamic | 'none'>('none');
  const [entryVoice, setEntryVoice] = useState<ScoreVoice>(1);
  const [inputLetter, setInputLetter] = useState('C');
  const [inputOctave, setInputOctave] = useState(4);
  const [cursorBeat, setCursorBeat] = useState(0);
  const [quantizeGrid, setQuantizeGrid] = useState<QuantizeGrid>('eighth');
  const [showPitchLabels, setShowPitchLabels] = useState(false);
  const [midiEnabled, setMidiEnabled] = useState(false);
  const player = useRef(new TonePlayer());
  const midiAccessRef = useRef<MIDIAccess | null>(null);
  const eventClipboardRef = useRef<MusicalNoteEvent | null>(null);
  const undoStack = useRef<ScoreDocument[]>([]);
  const redoStack = useRef<ScoreDocument[]>([]);
  const [historyVersion, setHistoryVersion] = useState(0);

  const score = project.score;
  const activeClef = useMemo(() => resolveScoreClef(score), [score]);
  const timing = useMemo(() => scoreTiming(score), [score]);
  const measureCount = useMemo(() => scoreMeasureCount(score), [score]);
  const rhythmIssues = useMemo(() => validateScoreRhythm(score), [score]);
  const selectedEvent = useMemo(
    () => score.notes.find((event) => event.id === selectedEventId) || null,
    [score.notes, selectedEventId]
  );
  const sortedEvents = useMemo(
    () => [...score.notes].sort((a, b) => a.start - b.start || Number(Boolean(a.isRest)) - Number(Boolean(b.isRest)) || a.midi - b.midi),
    [score.notes]
  );
  const writtenDurationBeats = durationBeats * (dotted ? 1.5 : 1);
  const [tupletActual, tupletNormal] = tupletRatio === '3:2' ? [3, 2] : tupletRatio === '5:4' ? [5, 4] : [1, 1];
  const effectiveDurationBeats = writtenDurationBeats * (tupletNormal / tupletActual);
  const cursorMeasure = Math.floor(cursorBeat / timing.measureBeats);
  const cursorBeatInMeasure = cursorBeat - cursorMeasure * timing.measureBeats;
  const svg = useMemo(
    () =>
      renderScoreSvg(score, 1200, {
        selectedEventId,
        showPitchLabels,
        cursorBeat
      }),
    [score, selectedEventId, showPitchLabels, cursorBeat]
  );

  useEffect(
    () => () => {
      player.current.stop();
      midiAccessRef.current?.inputs.forEach((input) => {
        input.onmidimessage = null;
      });
      if (midiAccessRef.current) midiAccessRef.current.onstatechange = null;
    },
    []
  );
  useEffect(() => {
    if (selectedEventId && !score.notes.some((event) => event.id === selectedEventId)) setSelectedEventId(null);
  }, [score.notes, selectedEventId]);

  const commitScore = useCallback(
    (nextScore: ScoreDocument) => {
      undoStack.current = [...undoStack.current.slice(-99), cloneScore(score)];
      redoStack.current = [];
      setProject((current) => ({
        ...current,
        updatedAt: Date.now(),
        score: { ...nextScore, updatedAt: Date.now() }
      }));
      setHistoryVersion((value) => value + 1);
    },
    [score, setProject]
  );

  const updateScore = useCallback(
    (patch: Partial<ScoreDocument>) => commitScore({ ...score, ...patch, updatedAt: Date.now() }),
    [commitScore, score]
  );

  const updateNote = useCallback(
    (id: string, patch: Partial<MusicalNoteEvent>) =>
      updateScore({ notes: score.notes.map((note) => (note.id === id ? synchronizeNotePitch({ ...note, ...patch }) : note)) }),
    [score.notes, updateScore]
  );

  const undo = () => {
    const previous = undoStack.current.pop();
    if (!previous) return;
    redoStack.current.push(cloneScore(score));
    setProject((current) => ({ ...current, updatedAt: Date.now(), score: cloneScore(previous) }));
    setHistoryVersion((value) => value + 1);
  };

  const redo = () => {
    const next = redoStack.current.pop();
    if (!next) return;
    undoStack.current.push(cloneScore(score));
    setProject((current) => ({ ...current, updatedAt: Date.now(), score: cloneScore(next) }));
    setHistoryVersion((value) => value + 1);
  };

  const gridBeats = useCallback(() => {
    if (quantizeGrid === 'quarter') return 1;
    if (quantizeGrid === 'eighth') return 0.5;
    if (quantizeGrid === 'triplet') return 1 / 3;
    return 0.25;
  }, [quantizeGrid]);

  const snapBeat = useCallback(
    (beat: number) => {
      const grid = gridBeats();
      return Math.max(0, Math.round(beat / grid) * grid);
    },
    [gridBeats]
  );

  const entryAccidentalSymbol = useCallback(
    (letter: string) => {
      if (accidental === 'sharp') return '♯';
      if (accidental === 'flat') return '♭';
      if (accidental === 'natural') return '';
      const keyAccidental = keySignatureAccidentalForLetter(score.keyFifths, letter);
      return keyAccidental === 1 ? '♯' : keyAccidental === -1 ? '♭' : '';
    },
    [accidental, score.keyFifths]
  );

  const pitchForInput = useCallback(() => {
    const symbol = entryAccidentalSymbol(inputLetter);
    return parseNoteSpelling(`${inputLetter}${symbol}${inputOctave}`);
  }, [entryAccidentalSymbol, inputLetter, inputOctave]);

  const smartPitchForLetter = useCallback(
    (letter: string) => {
      const symbol = entryAccidentalSymbol(letter);
      const cursorSeconds = quarterBeatsToSeconds(score, cursorBeat);
      const previous = [...score.notes]
        .filter((event) => !event.isRest && (event.voice || 1) === entryVoice && event.start <= cursorSeconds + EPSILON)
        .sort((a, b) => a.start - b.start || a.midi - b.midi)
        .at(-1);
      if (!previous) return parseNoteSpelling(`${letter}${symbol}${inputOctave}`);
      const normalizedPrevious = synchronizeNotePitch(previous);
      const candidates = [normalizedPrevious.octave - 1, normalizedPrevious.octave, normalizedPrevious.octave + 1]
        .map((octave) => parseNoteSpelling(`${letter}${symbol}${octave}`))
        .filter((pitch): pitch is { midi: number; note: string; octave: number } => Boolean(pitch));
      return candidates.sort((a, b) => Math.abs(a.midi - normalizedPrevious.midi) - Math.abs(b.midi - normalizedPrevious.midi))[0] || null;
    },
    [cursorBeat, entryAccidentalSymbol, entryVoice, inputOctave, score]
  );

  const insertEvent = useCallback(
    (
      kind: EntryMode,
      pitchOverride?: { midi: number; note: string; octave: number } | null,
      beatOverride?: number,
      advance = true
    ) => {
      const startBeat = Math.max(0, beatOverride ?? cursorBeat);
      const start = quarterBeatsToSeconds(score, startBeat);
      const duration = quarterBeatsToSeconds(score, effectiveDurationBeats);
      const id = crypto.randomUUID();
      const pitch = pitchOverride || pitchForInput() || { midi: 60, note: 'C', octave: 4 };
      const event: MusicalNoteEvent = {
        id,
        midi: pitch.midi,
        note: pitch.note,
        octave: pitch.octave,
        start,
        duration,
        velocity: kind === 'rest' ? 1 : 96,
        confidence: 1,
        isRest: kind === 'rest',
        voice: entryVoice,
        articulation: kind === 'note' && entryArticulation !== 'none' ? entryArticulation : undefined,
        dynamic: kind === 'note' && entryDynamic !== 'none' ? entryDynamic : undefined,
        tupletActual: tupletRatio === 'none' ? undefined : tupletActual,
        tupletNormal: tupletRatio === 'none' ? undefined : tupletNormal,
        tupletGroupId:
          tupletRatio === 'none'
            ? undefined
            : `tuplet-${tupletActual}-${tupletNormal}-${Math.floor((startBeat + EPSILON) / Math.max(0.0001, writtenDurationBeats * tupletNormal))}`
      };

      const samePosition = (candidate: MusicalNoteEvent) =>
        Math.abs(candidate.start - start) <= EPSILON && (candidate.voice || 1) === entryVoice;
      const retained =
        kind === 'rest'
          ? score.notes.filter((candidate) => !samePosition(candidate))
          : score.notes.filter((candidate) => !(candidate.isRest && samePosition(candidate)));
      commitScore({
        ...score,
        clef: score.clef === 'auto' || !score.clef ? activeClef : score.clef,
        notes: [...retained, event].sort((a, b) => a.start - b.start || a.midi - b.midi),
        minimumMeasures: Math.max(score.minimumMeasures || 1, Math.floor(startBeat / timing.measureBeats) + 1)
      });
      setSelectedEventId(id);
      setCursorBeat(advance ? startBeat + effectiveDurationBeats : startBeat);
      if (kind === 'note') {
        setInputLetter(pitch.note.charAt(0).toUpperCase());
        setInputOctave(pitch.octave);
      }
    },
    [activeClef, commitScore, cursorBeat, effectiveDurationBeats, entryArticulation, entryDynamic, entryVoice, pitchForInput, score, timing.measureBeats, tupletActual, tupletNormal, tupletRatio, writtenDurationBeats]
  );

  const insertEventRef = useRef(insertEvent);
  useEffect(() => {
    insertEventRef.current = insertEvent;
  }, [insertEvent]);

  const disableMidiInput = useCallback(() => {
    midiAccessRef.current?.inputs.forEach((input) => {
      input.onmidimessage = null;
    });
    if (midiAccessRef.current) midiAccessRef.current.onstatechange = null;
    midiAccessRef.current = null;
    setMidiEnabled(false);
  }, []);

  const toggleMidiInput = async () => {
    if (midiEnabled) {
      disableMidiInput();
      return;
    }
    if (!('requestMIDIAccess' in navigator)) {
      setMessage(x('score.midiUnavailable'));
      return;
    }
    try {
      const access = await (
        navigator as Navigator & { requestMIDIAccess: () => Promise<MIDIAccess> }
      ).requestMIDIAccess();
      const handler = (event: MIDIMessageEvent) => {
        if (!event.data) return;
        const [status = 0, midi = 0, velocity = 0] = event.data;
        if ((status & 0xf0) !== 0x90 || velocity <= 0) return;
        const pitch = midiToNote(midi);
        insertEventRef.current('note', { midi, note: pitch.note, octave: pitch.octave });
      };
      access.inputs.forEach((input) => {
        input.onmidimessage = handler;
      });
      access.onstatechange = () => {
        access.inputs.forEach((input) => {
          input.onmidimessage = handler;
        });
      };
      midiAccessRef.current = access;
      setMidiEnabled(true);
      setMessage(x('score.midiConnected'));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : x('score.midiUnavailable'));
    }
  };

  const handleStaffPointer = (point: ScoreStaffPointer) => {
    const localBeat = snapBeat(point.beatInMeasure);
    const absoluteBeat = point.measureIndex * timing.measureBeats + Math.min(localBeat, timing.measureBeats - 0.0001);
    setCursorBeat(absoluteBeat);
    if (entryMode === 'rest') {
      insertEvent('rest', null, absoluteBeat, !point.shiftKey);
      return;
    }
    const basePitch = pitchForStaffY(point.y, point.staffTop + 20, activeClef, 'natural');
    const pitch = basePitch
      ? parseNoteSpelling(`${basePitch.note.charAt(0)}${entryAccidentalSymbol(basePitch.note.charAt(0))}${basePitch.octave}`)
      : null;
    if (pitch) insertEvent('note', pitch, absoluteBeat, !point.shiftKey);
  };

  const pointToAbsoluteBeat = useCallback(
    (point: ScoreStaffPointer) => {
      const localBeat = snapBeat(point.beatInMeasure);
      return point.measureIndex * timing.measureBeats + Math.min(localBeat, timing.measureBeats - 0.0001);
    },
    [snapBeat, timing.measureBeats]
  );

  const moveEventOnScore = useCallback(
    (eventId: string, point: ScoreStaffPointer) => {
      const source = score.notes.find((event) => event.id === eventId);
      if (!source) return;
      const absoluteBeat = pointToAbsoluteBeat(point);
      const start = quarterBeatsToSeconds(score, absoluteBeat);
      let moved: MusicalNoteEvent = { ...source, start };
      if (!source.isRest) {
        const accidentalValue = noteAccidental(source);
        const accidentalChoice = accidentalValue === 1 ? 'sharp' : accidentalValue === -1 ? 'flat' : 'natural';
        const pitch = pitchForStaffY(point.y, point.staffTop + 20, activeClef, accidentalChoice);
        if (pitch) moved = synchronizeNotePitch({ ...moved, ...pitch });
      }
      commitScore({
        ...score,
        clef: score.clef === 'auto' || !score.clef ? activeClef : score.clef,
        notes: score.notes
          .map((event) => (event.id === eventId ? moved : event))
          .sort((a, b) => a.start - b.start || (a.voice || 1) - (b.voice || 1) || a.midi - b.midi),
        minimumMeasures: Math.max(score.minimumMeasures || 1, Math.floor(absoluteBeat / timing.measureBeats) + 1)
      });
      setCursorBeat(absoluteBeat);
      setSelectedEventId(eventId);
    },
    [activeClef, commitScore, pointToAbsoluteBeat, score, timing.measureBeats]
  );

  const copySelectedEvent = useCallback(() => {
    const selected = score.notes.find((event) => event.id === selectedEventId);
    if (!selected) return false;
    eventClipboardRef.current = { ...selected };
    return true;
  }, [score.notes, selectedEventId]);

  const pasteClipboardEvent = useCallback(() => {
    const source = eventClipboardRef.current;
    if (!source) return;
    const start = quarterBeatsToSeconds(score, cursorBeat);
    const copy = { ...source, id: crypto.randomUUID(), start };
    commitScore({
      ...score,
      notes: [...score.notes, copy].sort((a, b) => a.start - b.start || a.midi - b.midi)
    });
    setSelectedEventId(copy.id);
    setCursorBeat(cursorBeat + secondsToQuarterBeats(score, copy.duration));
  }, [commitScore, cursorBeat, score]);

  const chooseArticulation = useCallback(
    (value: ScoreArticulation) => {
      const selected = score.notes.find((event) => event.id === selectedEventId);
      if (selected && !selected.isRest) {
        updateNote(selected.id, { articulation: selected.articulation === value ? undefined : value });
        return;
      }
      setEntryArticulation((current) => (current === value ? 'none' : value));
    },
    [score.notes, selectedEventId, updateNote]
  );

  const chooseDynamic = useCallback(
    (value: ScoreDynamic) => {
      const selected = score.notes.find((event) => event.id === selectedEventId);
      if (selected && !selected.isRest) {
        updateNote(selected.id, { dynamic: selected.dynamic === value ? undefined : value });
        return;
      }
      setEntryDynamic((current) => (current === value ? 'none' : value));
    },
    [score.notes, selectedEventId, updateNote]
  );

  const toggleSelectedSlurStart = useCallback(() => {
    const selected = score.notes.find((event) => event.id === selectedEventId);
    if (!selected || selected.isRest) return;
    updateNote(selected.id, { slurStart: !selected.slurStart });
  }, [score.notes, selectedEventId, updateNote]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) return;

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') {
        event.preventDefault();
        redo();
        return;
      }
      if (event.key === 'Escape') {
        setSelectedEventId(null);
        return;
      }

      if ((event.ctrlKey || event.metaKey) && !event.altKey && (event.key === '3' || event.key === '5')) {
        event.preventDefault();
        setTupletRatio(event.key === '3' ? '3:2' : '5:4');
        return;
      }

      if ((event.ctrlKey || event.metaKey) && event.altKey && /^[1-4]$/.test(event.key)) {
        event.preventDefault();
        setEntryVoice(Number(event.key) as ScoreVoice);
        return;
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'c') {
        if (copySelectedEvent()) event.preventDefault();
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'x') {
        if (copySelectedEvent() && selectedEventId) {
          event.preventDefault();
          updateScore({ notes: score.notes.filter((note) => note.id !== selectedEventId) });
          setSelectedEventId(null);
        }
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'v') {
        if (eventClipboardRef.current) {
          event.preventDefault();
          pasteClipboardEvent();
        }
        return;
      }

      const shortcut = event.key.toLowerCase();
      if (event.shiftKey && !event.ctrlKey && !event.metaKey && !event.altKey) {
        if (shortcut === 's') {
          event.preventDefault();
          chooseArticulation('staccato');
          return;
        }
        if (shortcut === 'v') {
          event.preventDefault();
          chooseArticulation('accent');
          return;
        }
        if (shortcut === 'n') {
          event.preventDefault();
          chooseArticulation('tenuto');
          return;
        }
        if (shortcut === 'o') {
          event.preventDefault();
          chooseArticulation('marcato');
          return;
        }
      }
      if (shortcut === 's' && selectedEventId && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault();
        toggleSelectedSlurStart();
        return;
      }

      const letter = event.key.toUpperCase();
      if (/^[A-G]$/.test(letter) && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault();
        setEntryMode('note');
        setInputLetter(letter);
        const pitch = smartPitchForLetter(letter);
        insertEvent('note', pitch, undefined, !event.shiftKey);
        if (pitch) setInputOctave(pitch.octave);
        return;
      }
      if (event.key === '0' || event.key.toLowerCase() === 'r') {
        event.preventDefault();
        setEntryMode('rest');
        if (event.key === '0') insertEvent('rest');
        return;
      }
      if (event.key.toLowerCase() === 'n') {
        event.preventDefault();
        setEntryMode('note');
        return;
      }
      if (event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setAccidental('key');
        return;
      }
      if (event.key === '+') {
        event.preventDefault();
        setAccidental('sharp');
        return;
      }
      if (event.key === '-') {
        event.preventDefault();
        setAccidental('flat');
        return;
      }
      if (event.key === '=') {
        event.preventDefault();
        setAccidental('natural');
        return;
      }
      if (event.key === '.') {
        event.preventDefault();
        setDotted((value) => !value);
        return;
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        setCursorBeat((value) => Math.max(0, value - gridBeats()));
        return;
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        setCursorBeat((value) => value + gridBeats());
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key === 'ArrowUp') {
        event.preventDefault();
        setInputOctave((value) => Math.min(9, value + 1));
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key === 'ArrowDown') {
        event.preventDefault();
        setInputOctave((value) => Math.max(-1, value - 1));
        return;
      }
      const durationChoice = SCORE_DURATION_CHOICES.find((choice) => choice.shortcut === event.key);
      if (durationChoice) {
        event.preventDefault();
        setDurationBeats(durationChoice.beats);
        return;
      }
      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedEventId) {
        event.preventDefault();
        updateScore({ notes: score.notes.filter((note) => note.id !== selectedEventId) });
        setSelectedEventId(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    chooseArticulation,
    copySelectedEvent,
    gridBeats,
    insertEvent,
    pasteClipboardEvent,
    score.notes,
    selectedEventId,
    smartPitchForLetter,
    toggleSelectedSlurStart,
    updateScore
  ]);

  const changeNoteLabel = (id: string, value: string) => {
    const pitch = parseNoteSpelling(value);
    if (!pitch) {
      setMessage(x('score.invalidPitch'));
      return;
    }
    updateNote(id, pitch);
  };

  const removeNote = (id: string) => {
    updateScore({ notes: score.notes.filter((note) => note.id !== id) });
    if (selectedEventId === id) setSelectedEventId(null);
  };

  const duplicateNote = (id: string) => {
    const source = score.notes.find((note) => note.id === id);
    if (!source) return;
    const copy = {
      ...source,
      id: crypto.randomUUID(),
      start: source.start + source.duration,
      tieStart: false,
      tieStop: false
    };
    updateScore({ notes: [...score.notes, copy].sort((a, b) => a.start - b.start || a.midi - b.midi) });
    setSelectedEventId(copy.id);
  };

  const splitNote = (id: string) => {
    const index = score.notes.findIndex((note) => note.id === id);
    if (index < 0) return;
    const source = score.notes[index];
    const half = Math.max(0.025, source.duration / 2);
    const first = { ...source, duration: half, tieStart: source.isRest ? false : true };
    const second = {
      ...source,
      id: crypto.randomUUID(),
      start: source.start + half,
      duration: half,
      tieStop: source.isRest ? false : true,
      tieStart: false
    };
    const next = [...score.notes];
    next.splice(index, 1, first, second);
    updateScore({ notes: next });
  };

  const mergeNext = (id: string) => {
    const ordered = [...score.notes].sort((a, b) => a.start - b.start || a.midi - b.midi);
    const index = ordered.findIndex((note) => note.id === id);
    if (index < 0 || index >= ordered.length - 1) return;
    const current = ordered[index];
    const following = ordered
      .slice(index + 1)
      .find(
        (candidate) =>
          candidate.isRest === current.isRest && candidate.start >= current.start + current.duration - EPSILON
      );
    if (!following) {
      setMessage(x('score.mergeTypeMismatch'));
      return;
    }
    const merged = {
      ...current,
      duration: Math.max(current.duration, following.start + following.duration - current.start),
      lyric: [current.lyric, following.lyric].filter(Boolean).join(' '),
      tieStart: false,
      tieStop: false
    };
    updateScore({ notes: score.notes.filter((note) => note.id !== current.id && note.id !== following.id).concat(merged) });
  };

  const transposeScore = (semitones: number) => {
    updateScore({
      notes: score.notes.map((note) => {
        if (note.isRest) return note;
        const midi = Math.max(0, Math.min(127, synchronizeNotePitch(note).midi + semitones));
        const info = midiToNote(midi, semitones < 0);
        return { ...note, midi, note: info.note, octave: info.octave };
      })
    });
  };

  const quantizeScore = () => {
    const grid = gridBeats();
    updateScore({
      notes: score.notes
        .map((note) => {
          const startBeat = secondsToQuarterBeats(score, note.start);
          const eventDurationBeats = secondsToQuarterBeats(score, note.duration);
          return {
            ...note,
            start: quarterBeatsToSeconds(score, Math.max(0, Math.round(startBeat / grid) * grid)),
            duration: quarterBeatsToSeconds(score, Math.max(grid, Math.round(eventDurationBeats / grid) * grid))
          };
        })
        .sort((a, b) => a.start - b.start || a.midi - b.midi)
    });
  };

  const togglePlayback = async () => {
    if (playing) {
      player.current.stop();
      setPlaying(false);
      return;
    }
    const playable = [...score.notes].filter((note) => !note.isRest).sort((a, b) => a.start - b.start);
    if (!playable.length) return;
    setPlaying(true);
    await player.current.play(playable, 0.16, 'piano');
    const end = playable.reduce((max, note) => Math.max(max, note.start + note.duration), 0);
    window.setTimeout(() => setPlaying(false), end * 1000 + 150);
  };

  const importFile = async (file: File) => {
    try {
      const imported =
        file.name.toLowerCase().endsWith('.mid') || file.name.toLowerCase().endsWith('.midi')
          ? importMidi(await file.arrayBuffer())
          : importMusicXml(await file.text());
      commitScore({ ...imported, minimumMeasures: imported.minimumMeasures || scoreMeasureCount(imported) });
      setCursorBeat(0);
      setSelectedEventId(null);
      setMessage(t('score.importSuccess'));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t('score.importFailed'));
    }
  };

  const selectedStartBeat = selectedEvent ? secondsToQuarterBeats(score, selectedEvent.start) : 0;
  const selectedDurationBeats = selectedEvent ? secondsToQuarterBeats(score, selectedEvent.duration) : 0;

  return (
    <div className="page score-workspace" data-history-version={historyVersion}>
      <Seo title={t('score.title')} description={t('score.subtitle')} path="/score" />
      <div className="page-header score-page-header">
        <div className="page-title-wrap">
          <div className="eyebrow">OpenVox Score</div>
          <h1>{t('score.title')}</h1>
          <p>{x('score.proSubtitle')}</p>
        </div>
      </div>

      <div className="score-command-bar" aria-label={x('score.inputToolbar')}>
        <div className="score-command-group score-command-transport">
          <button className={`button ${playing ? 'button-danger' : 'button-primary'}`} onClick={() => void togglePlayback()}>
            <Icon name={playing ? 'stop' : 'play'} />
            {playing ? t('common.stop') : t('score.play')}
          </button>
          <button className="icon-button" disabled={!undoStack.current.length} onClick={undo} aria-label={x('score.undo')}>
            <Icon name="undo" />
          </button>
          <button className="icon-button" disabled={!redoStack.current.length} onClick={redo} aria-label={x('score.redo')}>
            <Icon name="redo" />
          </button>
        </div>

        <div className="score-command-group score-mode-switch" aria-label={x('score.entryMode')}>
          <button className={`score-tool-button ${entryMode === 'note' ? 'active' : ''}`} onClick={() => setEntryMode('note')}>
            <span className="score-tool-symbol">♪</span>
            <span>{t('score.note')}</span>
          </button>
          <button className={`score-tool-button ${entryMode === 'rest' ? 'active' : ''}`} onClick={() => setEntryMode('rest')}>
            <span className="score-tool-rest-icon" aria-hidden="true" />
            <span>{t('score.rest')}</span>
          </button>
        </div>

        <div className="score-command-group score-duration-tools" aria-label={x('score.durationPalette')}>
          {SCORE_DURATION_CHOICES.map((choice) => (
            <button
              key={choice.id}
              className={`score-duration-button ${durationBeats === choice.beats ? 'active' : ''}`}
              onClick={() => setDurationBeats(choice.beats)}
              title={`${choice.label} · ${choice.shortcut}`}
            >
              <ScoreDurationIcon beats={choice.beats} />
              <span className="score-duration-label">{choice.label}</span>
            </button>
          ))}
          <button className={`score-duration-button score-dot-button ${dotted ? 'active' : ''}`} onClick={() => setDotted((value) => !value)} title=".">
            •
          </button>
          <button
            className={`score-duration-button score-tuplet-button ${tupletRatio === '3:2' ? 'active' : ''}`}
            onClick={() => setTupletRatio((value) => value === '3:2' ? 'none' : '3:2')}
            title={`${x('score.triplet')} · Ctrl/Cmd+3`}
          >
            3:2
          </button>
          <button
            className={`score-duration-button score-tuplet-button ${tupletRatio === '5:4' ? 'active' : ''}`}
            onClick={() => setTupletRatio((value) => value === '5:4' ? 'none' : '5:4')}
            title={`${x('score.quintuplet')} · Ctrl/Cmd+5`}
          >
            5:4
          </button>
        </div>

        <div className="score-command-group score-accidental-tools" aria-label={x('score.accidentals')}>
          <button className={`score-symbol-button score-key-accidental ${accidental === 'key' ? 'active' : ''}`} onClick={() => setAccidental('key')} title="K">
            {x('score.keyAccidental')}
          </button>
          <button className={`score-symbol-button ${accidental === 'flat' ? 'active' : ''}`} onClick={() => setAccidental('flat')} title="-">
            ♭
          </button>
          <button className={`score-symbol-button ${accidental === 'natural' ? 'active' : ''}`} onClick={() => setAccidental('natural')} title="=">
            ♮
          </button>
          <button className={`score-symbol-button ${accidental === 'sharp' ? 'active' : ''}`} onClick={() => setAccidental('sharp')} title="+">
            ♯
          </button>
        </div>

        <div className="score-command-group score-articulation-tools" aria-label={x('score.articulations')}>
          <button
            className={`score-symbol-button score-articulation-button ${entryArticulation === 'staccato' || selectedEvent?.articulation === 'staccato' ? 'active' : ''}`}
            onClick={() => chooseArticulation('staccato')}
            title={`${x('score.staccato')} · Shift+S`}
          >
            •
          </button>
          <button
            className={`score-symbol-button score-articulation-button ${entryArticulation === 'tenuto' || selectedEvent?.articulation === 'tenuto' ? 'active' : ''}`}
            onClick={() => chooseArticulation('tenuto')}
            title={`${x('score.tenuto')} · Shift+N`}
          >
            —
          </button>
          <button
            className={`score-symbol-button score-articulation-button ${entryArticulation === 'accent' || selectedEvent?.articulation === 'accent' ? 'active' : ''}`}
            onClick={() => chooseArticulation('accent')}
            title={`${x('score.accent')} · Shift+V`}
          >
            &gt;
          </button>
          <button
            className={`score-symbol-button score-articulation-button ${entryArticulation === 'marcato' || selectedEvent?.articulation === 'marcato' ? 'active' : ''}`}
            onClick={() => chooseArticulation('marcato')}
            title={`${x('score.marcato')} · Shift+O`}
          >
            ^
          </button>
          <label className="score-compact-select score-dynamic-select">
            <span>{x('score.dynamic')}</span>
            <select
              value={selectedEvent && !selectedEvent.isRest ? selectedEvent.dynamic || 'none' : entryDynamic}
              onChange={(event) => {
                const value = event.target.value as ScoreDynamic | 'none';
                if (value === 'none') {
                  if (selectedEvent && !selectedEvent.isRest) updateNote(selectedEvent.id, { dynamic: undefined });
                  else setEntryDynamic('none');
                } else chooseDynamic(value);
              }}
            >
              <option value="none">—</option>
              {(['pp', 'p', 'mp', 'mf', 'f', 'ff'] as ScoreDynamic[]).map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="score-command-group score-voice-tools" aria-label={x('score.voices')}>
          {([1, 2, 3, 4] as ScoreVoice[]).map((voice) => (
            <button
              key={voice}
              className={`score-voice-button ${entryVoice === voice ? 'active' : ''}`}
              onClick={() => setEntryVoice(voice)}
              title={`${x('score.voice')} ${voice} · Ctrl/Cmd+Alt+${voice}`}
            >
              V{voice}
            </button>
          ))}
        </div>

        <div className="score-command-group score-pitch-tools">
          <label className="score-compact-select">
            <span>{x('score.pitch')}</span>
            <select value={inputLetter} onChange={(event) => setInputLetter(event.target.value)}>
              {['C', 'D', 'E', 'F', 'G', 'A', 'B'].map((letter) => (
                <option key={letter}>{letter}</option>
              ))}
            </select>
          </label>
          <button className="score-symbol-button" onClick={() => setInputOctave((value) => Math.max(-1, value - 1))} aria-label={x('score.octaveDown')}>
            −8
          </button>
          <span className="score-octave-value">{inputOctave}</span>
          <button className="score-symbol-button" onClick={() => setInputOctave((value) => Math.min(9, value + 1))} aria-label={x('score.octaveUp')}>
            +8
          </button>
          <button className="button button-primary score-insert-button" onClick={() => insertEvent(entryMode)}>
            <Icon name="plus" />
            {x('score.insertAtCursor')}
          </button>
        </div>

        <details className="score-command-menu">
          <summary className="button">
            <Icon name="menu" />
            {x('score.more')}
          </summary>
          <div className="score-command-popover">
            <label className="toolbar-select">
              <span>{x('score.quantize')}</span>
              <select value={quantizeGrid} onChange={(event) => setQuantizeGrid(event.target.value as QuantizeGrid)}>
                <option value="quarter">1/4</option>
                <option value="eighth">1/8</option>
                <option value="triplet">1/8T</option>
                <option value="sixteenth">1/16</option>
              </select>
            </label>
            <button className="button" disabled={!score.notes.length} onClick={quantizeScore}>
              <Icon name="chart" />
              {x('score.applyQuantize')}
            </button>
            <button className="button" disabled={!score.notes.length} onClick={() => transposeScore(-1)}>
              {x('score.transposeDown')}
            </button>
            <button className="button" disabled={!score.notes.length} onClick={() => transposeScore(1)}>
              {x('score.transposeUp')}
            </button>
            <button className={`button ${midiEnabled ? 'button-primary' : ''}`} onClick={() => void toggleMidiInput()}>
              <Icon name="music" />
              {midiEnabled ? x('score.midiDisable') : x('score.midiEnable')}
            </button>
            <label className="button file-button">
              <Icon name="upload" />
              {t('score.import')}
              <input type="file" accept=".musicxml,.xml,.mid,.midi" onChange={(event) => event.target.files?.[0] && void importFile(event.target.files[0])} />
            </label>
            <button className="button" onClick={() => exportMusicXml(score)}>{t('score.musicxml')}</button>
            <button className="button" onClick={() => exportMidi(score)}>{t('score.midi')}</button>
            <button className="button" onClick={() => exportSvg(score)}>{t('score.svg')}</button>
            <button className="button" onClick={() => void exportPng(score)}>{t('score.png')}</button>
            <button className="button" onClick={() => printScore(score)}>{t('score.pdf')}</button>
          </div>
        </details>

        <button className="button score-save-button" onClick={() => void persistProject().then(() => setMessage(t('status.saved')))}>
          <Icon name="save" />
          {t('common.save')}
        </button>
      </div>

      <div className="score-status-strip">
        <span>
          {x('score.cursor')}: {cursorMeasure + 1}.{cursorBeatInMeasure.toFixed(2)}
        </span>
        <span>{x('score.duration')}: {effectiveDurationBeats.toFixed(3).replace(/\.?0+$/, '')} ♩{tupletRatio !== 'none' ? ` · ${tupletRatio}` : ''}</span>
        <span>{measureCount} {x('score.measures')}</span>
        <button className="score-status-action" onClick={() => setShowPitchLabels((value) => !value)}>
          {showPitchLabels ? x('score.hidePitchLabels') : x('score.showPitchLabels')}
        </button>
        {rhythmIssues.length > 0 && <span className="score-status-warning">{rhythmIssues.length} {x('score.rhythmWarnings')}</span>}
      </div>

      {message && <div className="toast">{message}</div>}

      <div className="score-mobile-switch" role="tablist" aria-label="Score workspace">
        <button role="tab" aria-selected={mobilePane === 'edit'} className={mobilePane === 'edit' ? 'active' : ''} onClick={() => setMobilePane('edit')}>
          {t('score.note')}
        </button>
        <button role="tab" aria-selected={mobilePane === 'preview'} className={mobilePane === 'preview' ? 'active' : ''} onClick={() => setMobilePane('preview')}>
          {t('score.preview')}
        </button>
      </div>

      <div className="editor-layout score-editor-layout" data-mobile-pane={mobilePane}>
        <aside className="card editor-panel score-editor-pane score-inspector-panel">
          <details className="score-panel-section" open>
            <summary>{x('score.documentSettings')}</summary>
            <div className="score-panel-section-body">
              <div className="field">
                <label>{t('score.metaTitle')}</label>
                <input aria-label={t('score.metaTitle')} value={score.title} onChange={(event) => updateScore({ title: event.target.value })} />
              </div>
              <div className="field">
                <label>{t('score.composer')}</label>
                <input aria-label={t('score.composer')} value={score.composer} onChange={(event) => updateScore({ composer: event.target.value })} />
              </div>
              <div className="field">
                <label>{t('score.tempo')} · {score.tempo} BPM</label>
                <input aria-label={t('score.tempo')} type="range" min="40" max="220" value={score.tempo} onChange={(event) => updateScore({ tempo: Number(event.target.value) })} />
              </div>
              <div className="field-row score-settings-grid">
                <div className="field">
                  <label>{t('score.timeSignature')}</label>
                  <select aria-label={t('score.timeSignature')} value={`${score.timeSignature[0]}/${score.timeSignature[1]}`} onChange={(event) => {
                    const [a, b] = event.target.value.split('/').map(Number);
                    updateScore({ timeSignature: [a, b] });
                  }}>
                    <option>2/4</option><option>3/4</option><option>4/4</option><option>5/4</option><option>6/8</option><option>7/8</option><option>9/8</option><option>12/8</option>
                  </select>
                </div>
                <div className="field">
                  <label>{t('score.keySignature')}</label>
                  <select aria-label={t('score.keySignature')} value={score.keyFifths} onChange={(event) => updateScore({ keyFifths: Number(event.target.value) })}>
                    {KEY_SIGNATURE_LABELS.map((key) => <option key={key.fifths} value={key.fifths}>{key.label}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>{x('score.clef')}</label>
                  <select aria-label={x('score.clef')} value={score.clef || 'auto'} onChange={(event) => updateScore({ clef: event.target.value as ScoreDocument['clef'] })}>
                    <option value="auto">{x('score.clefAuto')}</option>
                    <option value="treble">{x('score.clefTreble')}</option>
                    <option value="bass">{x('score.clefBass')}</option>
                  </select>
                </div>
                <div className="field">
                  <label>{x('score.measures')}</label>
                  <div className="score-stepper">
                    <button className="mini-button" onClick={() => updateScore({ minimumMeasures: Math.max(1, measureCount - 1) })}>−</button>
                    <span>{measureCount}</span>
                    <button className="mini-button" onClick={() => updateScore({ minimumMeasures: measureCount + 1 })}>+</button>
                  </div>
                </div>
              </div>
            </div>
          </details>

          <section className="score-panel-section score-event-browser">
            <div className="score-panel-heading">
              <div>
                <span className="eyebrow">{x('score.timeline')}</span>
                <h2>{score.notes.length} {x('score.explicitEvents')}</h2>
              </div>
              <button className="mini-button" onClick={() => insertEvent(entryMode)}>{entryMode === 'rest' ? t('score.addRest') : t('score.add')}</button>
            </div>
            <ul className="score-event-list">
              {sortedEvents.length ? sortedEvents.map((event) => {
                const pitch = synchronizeNotePitch(event);
                const startBeat = secondsToQuarterBeats(score, event.start);
                const eventBeats = secondsToQuarterBeats(score, event.duration);
                return (
                  <li key={event.id} className="score-event-list-item">
                    <button className={`score-event-row note-row ${selectedEventId === event.id ? 'active' : ''}`} onClick={() => setSelectedEventId(event.id)}>
                      <span className={`score-event-kind ${event.isRest ? 'rest' : 'note'}`}>{event.isRest ? `V${event.voice || 1} —` : `V${event.voice || 1} ${pitch.note}${pitch.octave}`}</span>
                      <span>M{Math.floor(startBeat / timing.measureBeats) + 1}</span>
                      <span>{(startBeat % timing.measureBeats).toFixed(2)}</span>
                      <span>{eventBeats.toFixed(2)} ♩</span>
                    </button>
                  </li>
                );
              }) : (
                <li className="score-event-list-item">
                  <div className="empty-state">{t('score.empty')}</div>
                </li>
              )}
            </ul>
          </section>

          {selectedEvent && (
            <section className="score-panel-section score-selection-inspector">
              <div className="score-panel-heading">
                <div>
                  <span className="eyebrow">{x('score.selection')}</span>
                  <h2>{selectedEvent.isRest ? t('score.rest') : `${selectedEvent.note}${selectedEvent.octave}`}</h2>
                </div>
                <button className="icon-button" onClick={() => removeNote(selectedEvent.id)} aria-label={t('common.delete')}><Icon name="trash" /></button>
              </div>
              <div className="score-inspector-grid">
                <div className="field">
                  <label>{t('score.type')}</label>
                  <select value={selectedEvent.isRest ? 'rest' : 'note'} onChange={(event) => updateNote(selectedEvent.id, {
                    isRest: event.target.value === 'rest',
                    velocity: event.target.value === 'rest' ? 1 : Math.max(1, selectedEvent.velocity),
                    tieStart: event.target.value === 'rest' ? false : selectedEvent.tieStart,
                    tieStop: event.target.value === 'rest' ? false : selectedEvent.tieStop,
                    slurStart: event.target.value === 'rest' ? false : selectedEvent.slurStart,
                    slurStop: event.target.value === 'rest' ? false : selectedEvent.slurStop,
                    articulation: event.target.value === 'rest' ? undefined : selectedEvent.articulation,
                    dynamic: event.target.value === 'rest' ? undefined : selectedEvent.dynamic
                  })}>
                    <option value="note">{t('score.note')}</option>
                    <option value="rest">{t('score.rest')}</option>
                  </select>
                </div>
                <div className="field">
                  <label>{x('score.voice')}</label>
                  <select
                    value={selectedEvent.voice || 1}
                    onChange={(event) => updateNote(selectedEvent.id, { voice: Number(event.target.value) as ScoreVoice })}
                  >
                    {([1, 2, 3, 4] as ScoreVoice[]).map((voice) => (
                      <option key={voice} value={voice}>{x('score.voice')} {voice}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>{x('score.pitch')}</label>
                  <input
                    key={`${selectedEvent.id}-${selectedEvent.note}-${selectedEvent.octave}-${selectedEvent.isRest ? 'rest' : 'note'}`}
                    disabled={Boolean(selectedEvent.isRest)}
                    defaultValue={selectedEvent.isRest ? t('score.rest') : `${selectedEvent.note}${selectedEvent.octave}`}
                    onBlur={(event) => !selectedEvent.isRest && changeNoteLabel(selectedEvent.id, event.target.value)}
                  />
                </div>
                <div className="field">
                  <label>{x('score.startBeat')}</label>
                  <input type="number" min="0" step="0.125" value={Number(selectedStartBeat.toFixed(4))} onChange={(event) => updateNote(selectedEvent.id, { start: quarterBeatsToSeconds(score, Math.max(0, Number(event.target.value))) })} />
                </div>
                <div className="field">
                  <label>{x('score.durationBeats')}</label>
                  <input type="number" min="0.125" step="0.125" value={Number(selectedDurationBeats.toFixed(4))} onChange={(event) => updateNote(selectedEvent.id, { duration: quarterBeatsToSeconds(score, Math.max(0.125, Number(event.target.value))) })} />
                </div>
                <div className="field">
                  <label>{t('score.velocity')}</label>
                  <input type="number" min="1" max="127" disabled={Boolean(selectedEvent.isRest)} value={selectedEvent.velocity} onChange={(event) => updateNote(selectedEvent.id, { velocity: Math.max(1, Math.min(127, Number(event.target.value))) })} />
                </div>
                <div className="field">
                  <label>{t('score.tie')}</label>
                  <select disabled={Boolean(selectedEvent.isRest)} value={`${selectedEvent.tieStop ? 'stop' : ''}${selectedEvent.tieStart ? 'start' : ''}`} onChange={(event) => updateNote(selectedEvent.id, {
                    tieStart: event.target.value.includes('start'),
                    tieStop: event.target.value.includes('stop')
                  })}>
                    <option value="">{t('score.none')}</option>
                    <option value="start">{t('score.tieStart')}</option>
                    <option value="stop">{t('score.tieStop')}</option>
                    <option value="stopstart">{t('score.tieContinue')}</option>
                  </select>
                </div>
                <div className="field">
                  <label>{x('score.articulation')}</label>
                  <select
                    disabled={Boolean(selectedEvent.isRest)}
                    value={selectedEvent.articulation || 'none'}
                    onChange={(event) => updateNote(selectedEvent.id, {
                      articulation: event.target.value === 'none' ? undefined : event.target.value as ScoreArticulation
                    })}
                  >
                    <option value="none">{t('score.none')}</option>
                    <option value="staccato">{x('score.staccato')}</option>
                    <option value="tenuto">{x('score.tenuto')}</option>
                    <option value="accent">{x('score.accent')}</option>
                    <option value="marcato">{x('score.marcato')}</option>
                  </select>
                </div>
                <div className="field">
                  <label>{x('score.dynamic')}</label>
                  <select
                    disabled={Boolean(selectedEvent.isRest)}
                    value={selectedEvent.dynamic || 'none'}
                    onChange={(event) => updateNote(selectedEvent.id, {
                      dynamic: event.target.value === 'none' ? undefined : event.target.value as ScoreDynamic
                    })}
                  >
                    <option value="none">{t('score.none')}</option>
                    {(['pp', 'p', 'mp', 'mf', 'f', 'ff'] as ScoreDynamic[]).map((value) => (
                      <option key={value} value={value}>{value}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>{x('score.slur')}</label>
                  <select
                    disabled={Boolean(selectedEvent.isRest)}
                    value={`${selectedEvent.slurStop ? 'stop' : ''}${selectedEvent.slurStart ? 'start' : ''}`}
                    onChange={(event) => updateNote(selectedEvent.id, {
                      slurStart: event.target.value.includes('start'),
                      slurStop: event.target.value.includes('stop')
                    })}
                  >
                    <option value="">{t('score.none')}</option>
                    <option value="start">{x('score.slurStart')}</option>
                    <option value="stop">{x('score.slurStop')}</option>
                    <option value="stopstart">{x('score.slurContinue')}</option>
                  </select>
                </div>
                <div className="field">
                  <label>{x('score.tuplet')}</label>
                  <select
                    value={selectedEvent.tupletActual && selectedEvent.tupletNormal ? `${selectedEvent.tupletActual}:${selectedEvent.tupletNormal}` : 'none'}
                    onChange={(event) => {
                      const value = event.target.value as TupletRatio;
                      const [actual, normal] = value === '3:2' ? [3, 2] : value === '5:4' ? [5, 4] : [undefined, undefined];
                      updateNote(selectedEvent.id, {
                        tupletActual: actual,
                        tupletNormal: normal,
                        tupletGroupId: value === 'none' ? undefined : selectedEvent.tupletGroupId || `tuplet-manual-${crypto.randomUUID()}`
                      });
                    }}
                  >
                    <option value="none">{t('score.none')}</option>
                    <option value="3:2">{x('score.triplet')}</option>
                    <option value="5:4">{x('score.quintuplet')}</option>
                  </select>
                </div>
                <div className="field score-inspector-lyric">
                  <label>{t('score.lyric')}</label>
                  <input disabled={Boolean(selectedEvent.isRest)} value={selectedEvent.lyric || ''} onChange={(event) => updateNote(selectedEvent.id, { lyric: event.target.value })} />
                </div>
              </div>
              <div className="score-inspector-actions">
                <button className="mini-button" onClick={() => duplicateNote(selectedEvent.id)}>{t('score.copy')}</button>
                <button className="mini-button" onClick={() => splitNote(selectedEvent.id)}>{t('score.split')}</button>
                <button className="mini-button" onClick={() => mergeNext(selectedEvent.id)}>{t('score.merge')}</button>
              </div>
            </section>
          )}
        </aside>

        <section className="card score-preview-card score-preview-pane score-canvas-card">
          <div className="card-title score-canvas-heading">
            <div>
              <span className="eyebrow">{x('score.clickToEnter')}</span>
              <h2>{t('score.preview')}</h2>
            </div>
            <span className="badge">{measureCount} {x('score.measures')}</span>
          </div>
          <ScoreViewport
            svg={svg}
            label={t('score.preview')}
            onEventSelect={setSelectedEventId}
            onEventMove={moveEventOnScore}
            onStaffPointer={handleStaffPointer}
          />
          <div className="score-keyboard-hint">{x('score.keyboardHint')}</div>
        </section>
      </div>
    </div>
  );
}
