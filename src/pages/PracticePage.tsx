import { useEffect, useMemo, useRef, useState } from 'react';
import { Seo } from '../components/Seo';
import { Icon } from '../components/Icon';
import { useI18n } from '../i18n/I18nContext';
import { midiToNote, parseNoteLabel } from '../core/music/notes';
import type { MusicalNoteEvent } from '../types';
import { TonePlayer } from '../core/music/player';
import { downloadBlob } from '../core/export/scoreExport';
import { useApp } from '../app/AppContext';
import { useAudioEngine } from '../hooks/useAudioEngine';
import { saveTrainingSession } from '../core/storage/database';

const patterns = {
  scale: [0, 2, 4, 5, 7, 9, 11, 12],
  arpeggio: [0, 4, 7, 12],
  intervals: [0, 7, 2, 9, 4, 11, 5, 12],
  sustain: [0, 2, 4, 5, 7],
  custom: [] as number[]
};

type ExerciseKind = keyof typeof patterns;
type SharedExercise = {
  version: 1;
  exercise: ExerciseKind;
  startNote: string;
  repeats: number;
  direction: 'up' | 'down' | 'both';
  tempo: number;
  transposeStep?: number;
  endNote?: string;
  customNotes?: string;
};

type PracticeMetrics = {
  samples: number;
  averageCents: number;
  accuracy: number;
  hitRate: number;
};

function encodeExercise(value: SharedExercise): string {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function decodeExercise(value: string): SharedExercise | null {
  try {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    const parsed = JSON.parse(new TextDecoder().decode(bytes)) as SharedExercise;
    return parsed.version === 1 && parsed.exercise in patterns ? parsed : null;
  } catch {
    return null;
  }
}

function parseCustomNotes(value: string): number[] {
  return value
    .split(/[\s,;]+/)
    .map(parseNoteLabel)
    .filter((value): value is number => value !== null);
}

export function PracticePage() {
  const { t } = useI18n();
  const { settings, project } = useApp();
  const audio = useAudioEngine(settings.referenceA4, settings.processingMode, settings.gateMultiplier);
  const [exercise, setExercise] = useState<ExerciseKind>('scale');
  const [startNote, setStartNote] = useState('C3');
  const [endNote, setEndNote] = useState('C5');
  const [customNotes, setCustomNotes] = useState('C3 D3 E3 F3 G3');
  const [repeats, setRepeats] = useState(4);
  const [transposeStep, setTransposeStep] = useState(1);
  const [direction, setDirection] = useState<'up' | 'down' | 'both'>('both');
  const [tempo, setTempo] = useState(84);
  const [playing, setPlaying] = useState(false);
  const [practicing, setPracticing] = useState(false);
  const [shareMessage, setShareMessage] = useState('');
  const [targetLabel, setTargetLabel] = useState('—');
  const [liveCents, setLiveCents] = useState<number | null>(null);
  const [metrics, setMetrics] = useState<PracticeMetrics | null>(null);
  const player = useRef(new TonePlayer());
  const practiceStartFrame = useRef<number | null>(null);
  const evaluation = useRef({ samples: 0, centsTotal: 0, hits: 0 });
  const stopTimer = useRef<number | null>(null);
  const practiceStartedAt = useRef(0);

  useEffect(() => {
    const encoded = new URLSearchParams(window.location.search).get('exercise');
    if (!encoded) return;
    const shared = decodeExercise(encoded);
    if (!shared) return;
    setExercise(shared.exercise);
    setStartNote(shared.startNote);
    setRepeats(shared.repeats);
    setDirection(shared.direction);
    setTempo(shared.tempo);
    setTransposeStep(shared.transposeStep ?? 1);
    setEndNote(shared.endNote ?? 'C5');
    setCustomNotes(shared.customNotes ?? 'C3 D3 E3 F3 G3');
    setShareMessage(t('practice.loaded'));
  }, [t]);

  const exerciseConfig = (): SharedExercise => ({
    version: 1,
    exercise,
    startNote,
    repeats,
    direction,
    tempo,
    transposeStep,
    endNote,
    customNotes
  });

  const copyShareLink = async () => {
    const url = new URL(window.location.href);
    url.searchParams.set('exercise', encodeExercise(exerciseConfig()));
    await navigator.clipboard.writeText(url.toString());
    setShareMessage(t('practice.linkCopied'));
  };

  const exportExercise = () => {
    const blob = new Blob([JSON.stringify({ format: 'openvox-exercise', ...exerciseConfig() }, null, 2)], {
      type: 'application/json'
    });
    downloadBlob(blob, `OpenVox_${exercise}_${startNote}.openvox-exercise`);
    setShareMessage(t('practice.fileExported'));
  };

  const importExercise = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text()) as SharedExercise & { format?: string };
      if (parsed.version !== 1 || !(parsed.exercise in patterns)) throw new Error('Unsupported exercise file.');
      setExercise(parsed.exercise);
      setStartNote(parsed.startNote);
      setRepeats(parsed.repeats);
      setDirection(parsed.direction);
      setTempo(parsed.tempo);
      setTransposeStep(parsed.transposeStep ?? 1);
      setEndNote(parsed.endNote ?? 'C5');
      setCustomNotes(parsed.customNotes ?? '');
      setShareMessage(t('practice.fileImported'));
    } catch (error) {
      setShareMessage(error instanceof Error ? error.message : 'Exercise import failed.');
    }
  };

  const notes = useMemo(() => {
    const root = parseNoteLabel(startNote) ?? 48;
    const ceiling = parseNoteLabel(endNote) ?? 84;
    const sequence: MusicalNoteEvent[] = [];
    let time = 0;
    const beat = 60 / tempo;
    const customMidi = parseCustomNotes(customNotes);

    for (let repeat = 0; repeat < repeats; repeat++) {
      const transposition = repeat * transposeStep;
      if (root + transposition > ceiling) break;
      let midiPattern: number[];
      if (exercise === 'custom' && customMidi.length) {
        const base = customMidi[0];
        midiPattern = customMidi.map((midi) => root + transposition + (midi - base));
      } else {
        let intervalPattern = [...patterns[exercise]];
        if (direction === 'down') intervalPattern = [...intervalPattern].reverse();
        if (direction === 'both') intervalPattern = [...intervalPattern, ...intervalPattern.slice(0, -1).reverse()];
        midiPattern = intervalPattern.map((interval) => root + transposition + interval);
      }

      midiPattern.forEach((midi) => {
        const info = midiToNote(midi);
        const duration = exercise === 'sustain' ? beat * 2 : beat * 0.72;
        sequence.push({
          id: crypto.randomUUID(),
          midi,
          note: info.note,
          octave: info.octave,
          start: time,
          duration,
          velocity: 92,
          confidence: 1
        });
        time += exercise === 'sustain' ? beat * 2.25 : beat;
      });
      time += beat * 0.5;
    }
    return sequence;
  }, [exercise, startNote, endNote, customNotes, repeats, transposeStep, direction, tempo]);

  useEffect(
    () =>
      audio.subscribePitch((frame) => {
        if (!practicing || !notes.length || frame.confidence < 0.55) return;
        if (practiceStartFrame.current === null) practiceStartFrame.current = frame.timestamp;
        const elapsed = frame.timestamp - practiceStartFrame.current;
        const target = notes.find((note) => elapsed >= note.start && elapsed <= note.start + note.duration);
        if (!target) return;
        const cents = (frame.midi - target.midi) * 100;
        setTargetLabel(`${target.note}${target.octave}`);
        setLiveCents(cents);
        const abs = Math.abs(cents);
        evaluation.current.samples += 1;
        evaluation.current.centsTotal += abs;
        if (abs <= 50) evaluation.current.hits += 1;
      }),
    [audio, practicing, notes]
  );

  useEffect(
    () => () => {
      player.current.stop();
      if (stopTimer.current) window.clearTimeout(stopTimer.current);
    },
    []
  );

  const play = async () => {
    if (!notes.length) return;
    setPlaying(true);
    await player.current.play(notes, 0.18, 'vocal');
    const end = notes[notes.length - 1].start + notes[notes.length - 1].duration;
    window.setTimeout(() => setPlaying(false), end * 1000 + 150);
  };

  const stop = () => {
    player.current.stop();
    setPlaying(false);
  };

  const finishPractice = () => {
    if (stopTimer.current) window.clearTimeout(stopTimer.current);
    stopTimer.current = null;
    player.current.stop();
    setPlaying(false);
    setPracticing(false);
    const result = evaluation.current;
    if (result.samples) {
      const averageCents = result.centsTotal / result.samples;
      const completedMetrics = {
        samples: result.samples,
        averageCents,
        accuracy: Math.max(0, Math.round(100 - averageCents * 1.15)),
        hitRate: Math.round((result.hits / result.samples) * 100)
      };
      setMetrics(completedMetrics);
      void saveTrainingSession({
        id: crypto.randomUUID(),
        projectId: project.id,
        exerciseId: `practice-${exercise}`,
        exerciseName: `${exercise} · ${startNote}`,
        category: exercise === 'sustain' ? 'pitch' : exercise === 'intervals' ? 'ear' : 'agility',
        difficulty: 'intermediate',
        startedAt: practiceStartedAt.current || Date.now(),
        completedAt: Date.now(),
        durationSeconds: Math.max(1, (Date.now() - practiceStartedAt.current) / 1000),
        accuracy: completedMetrics.accuracy,
        hitRate: completedMetrics.hitRate,
        averageCents: completedMetrics.averageCents,
        score: completedMetrics.accuracy
      }).catch(() => undefined);
    }
  };

  const startPractice = async () => {
    if (!notes.length) return;
    if (!audio.state.active)
      await audio.engine.start({
        deviceId: settings.microphoneId || undefined,
        processingMode: settings.processingMode,
        referenceA4: settings.referenceA4,
        gateMultiplier: settings.gateMultiplier,
        noiseFloor: project.settings.noiseFloor,
        audioPreferences: settings.audio
      });
    evaluation.current = { samples: 0, centsTotal: 0, hits: 0 };
    practiceStartedAt.current = Date.now();
    practiceStartFrame.current = null;
    setMetrics(null);
    setLiveCents(null);
    setTargetLabel('—');
    setPracticing(true);
    setPlaying(true);
    await player.current.play(notes, 0.14, 'vocal');
    const end = notes[notes.length - 1].start + notes[notes.length - 1].duration;
    stopTimer.current = window.setTimeout(finishPractice, end * 1000 + 350);
  };

  return (
    <div className="page">
      <Seo title={t('practice.title')} description={t('practice.subtitle')} path="/practice" />
      <div className="page-header">
        <div className="page-title-wrap">
          <div className="eyebrow">OpenVox Exercises</div>
          <h1>{t('practice.title')}</h1>
          <p>{t('practice.subtitle')}</p>
        </div>
      </div>
      <div className="practice-grid">
        <section className="card panel span-5">
          <div className="field">
            <label>{t('practice.exercise')}</label>
            <select
              aria-label={t('practice.exercise')}
              value={exercise}
              onChange={(e) => setExercise(e.target.value as ExerciseKind)}
            >
              <option value="scale">{t('practice.scale')}</option>
              <option value="arpeggio">{t('practice.arpeggio')}</option>
              <option value="intervals">{t('practice.intervals')}</option>
              <option value="sustain">{t('practice.sustain')}</option>
              <option value="custom">{t('practice.custom')}</option>
            </select>
          </div>
          <div className="field-row">
            <div className="field">
              <label>{t('practice.startNote')}</label>
              <input
                aria-label={t('practice.startNote')}
                value={startNote}
                onChange={(e) => setStartNote(e.target.value)}
              />
            </div>
            <div className="field">
              <label>{t('practice.endNote')}</label>
              <input aria-label={t('practice.endNote')} value={endNote} onChange={(e) => setEndNote(e.target.value)} />
            </div>
          </div>
          {exercise === 'custom' && (
            <div className="field">
              <label>{t('practice.customNotes')}</label>
              <textarea
                aria-label={t('practice.customNotes')}
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                rows={3}
              />
            </div>
          )}
          <div className="field">
            <label>
              {t('practice.repeats')} · {repeats}
            </label>
            <input
              aria-label={t('practice.repeats')}
              type="range"
              min="1"
              max="16"
              value={repeats}
              onChange={(e) => setRepeats(Number(e.target.value))}
            />
          </div>
          <div className="field">
            <label>
              {t('practice.transposeStep')} · +{transposeStep}
            </label>
            <input
              aria-label={t('practice.transposeStep')}
              type="range"
              min="0"
              max="3"
              value={transposeStep}
              onChange={(e) => setTransposeStep(Number(e.target.value))}
            />
          </div>
          <div className="field">
            <label>
              {t('practice.tempo')} · {tempo} BPM
            </label>
            <input
              aria-label={t('practice.tempo')}
              type="range"
              min="40"
              max="200"
              value={tempo}
              onChange={(e) => setTempo(Number(e.target.value))}
            />
          </div>
          {exercise !== 'custom' && (
            <div className="field">
              <label>{t('practice.direction')}</label>
              <div className="segmented">
                <button className={direction === 'up' ? 'active' : ''} onClick={() => setDirection('up')}>
                  {t('practice.up')}
                </button>
                <button className={direction === 'down' ? 'active' : ''} onClick={() => setDirection('down')}>
                  {t('practice.down')}
                </button>
                <button className={direction === 'both' ? 'active' : ''} onClick={() => setDirection('both')}>
                  {t('practice.both')}
                </button>
              </div>
            </div>
          )}
          <div className="action-row">
            {playing && !practicing ? (
              <button className="button button-danger" onClick={stop}>
                <Icon name="stop" />
                {t('practice.stop')}
              </button>
            ) : (
              <button className="button" disabled={practicing} onClick={() => void play()}>
                <Icon name="play" />
                {t('practice.play')}
              </button>
            )}
            {practicing ? (
              <button className="button button-danger" onClick={finishPractice}>
                <Icon name="stop" />
                {t('practice.finishPractice')}
              </button>
            ) : (
              <button className="button button-primary" onClick={() => void startPractice()}>
                <Icon name="mic" />
                {t('practice.startPractice')}
              </button>
            )}
          </div>
          <p className="hint">{t('practice.headphones')}</p>
          {audio.error && (
            <p className="hint" style={{ color: 'var(--red)' }}>
              {audio.error}
            </p>
          )}
          <div className="teacher-tools">
            <div className="card-title">
              <h3>{t('practice.teacherTitle')}</h3>
              <span className="badge">{t('practice.serverless')}</span>
            </div>
            <p className="hint">{t('practice.teacherBody')}</p>
            <div className="action-row">
              <button className="button" onClick={() => void copyShareLink()}>
                <Icon name="upload" />
                {t('practice.copyLink')}
              </button>
              <button className="button" onClick={exportExercise}>
                <Icon name="download" />
                {t('practice.exportExercise')}
              </button>
              <label className="button file-button">
                <Icon name="upload" />
                {t('practice.importExercise')}
                <input
                  type="file"
                  accept=".openvox-exercise,application/json"
                  onChange={(e) => e.target.files?.[0] && void importExercise(e.target.files[0])}
                />
              </label>
            </div>
            {shareMessage && <p className="hint">{shareMessage}</p>}
          </div>
        </section>
        <section className="card panel span-7">
          <div className="card-title">
            <h2>{t('practice.generated')}</h2>
            <span className="badge">{t('practice.autoTranspose')}</span>
          </div>
          <div className="exercise-notes">
            {notes.slice(0, 100).map((note) => (
              <span className="exercise-note" key={note.id}>
                {note.note}
                {note.octave}
              </span>
            ))}
          </div>
          <div className="practice-evaluation">
            <div className="metric">
              <span>{t('practice.target')}</span>
              <strong>{targetLabel}</strong>
            </div>
            <div className="metric">
              <span>{t('practice.deviation')}</span>
              <strong>{liveCents === null ? '—' : `${liveCents > 0 ? '+' : ''}${Math.round(liveCents)} ¢`}</strong>
            </div>
            <div className="metric">
              <span>{t('practice.accuracy')}</span>
              <strong>{metrics ? `${metrics.accuracy}%` : '—'}</strong>
            </div>
            <div className="metric">
              <span>{t('practice.hitRate')}</span>
              <strong>{metrics ? `${metrics.hitRate}%` : '—'}</strong>
            </div>
          </div>
          {metrics && (
            <p className="hint">
              {t('practice.averageDeviation')}: {metrics.averageCents.toFixed(1)} ¢ · {metrics.samples}{' '}
              {t('common.frames')}
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
