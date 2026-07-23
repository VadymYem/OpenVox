import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../app/AppContext';
import { Icon } from '../components/Icon';
import { Seo } from '../components/Seo';
import { ScoreViewport } from '../components/ScoreViewport';
import { importMidi } from '../core/music/midiImport';
import { importMusicXml } from '../core/music/musicXmlImport';
import {
  importMidiEnsemble,
  importMusicXmlEnsemble,
  type EnsembleDocument,
  type EnsemblePart
} from '../core/music/ensembleImport';
import { TonePlayer } from '../core/music/player';
import { renderScoreSvg } from '../core/music/scoreRenderer';
import { midiToNote } from '../core/music/notes';
import { useI18n } from '../i18n/I18nContext';
import { proText } from '../i18n/proTranslations';
import { useAudioEngine } from '../hooks/useAudioEngine';
import { saveTrainingSession } from '../core/storage/database';
import type { MusicalNoteEvent } from '../types';

function buildMetronome(end: number, tempo: number): MusicalNoteEvent[] {
  const beat = 60 / Math.max(30, tempo);
  const notes: MusicalNoteEvent[] = [];
  for (let time = 0, index = 0; time <= end; time += beat, index += 1) {
    const midi = index % 4 === 0 ? 84 : 79;
    const info = midiToNote(midi);
    notes.push({
      id: crypto.randomUUID(),
      midi,
      note: info.note,
      octave: info.octave,
      start: time,
      duration: 0.05,
      velocity: 110,
      confidence: 1
    });
  }
  return notes;
}

export function transformRehearsalNotes(
  notes: MusicalNoteEvent[],
  start: number,
  end: number,
  speed: number,
  repetitions: number
): MusicalNoteEvent[] {
  if (!notes.length || end <= start) return [];
  const rate = Math.max(0.5, Math.min(1.5, speed));
  const repeatCount = Math.max(1, Math.min(8, Math.round(repetitions)));
  const passageDuration = Math.max(0.05, (end - start) / rate);
  const base = notes
    .filter((note) => !note.isRest && note.start + note.duration >= start && note.start <= end)
    .map((note) => {
      const clippedStart = Math.max(start, note.start);
      const clippedEnd = Math.min(end, note.start + note.duration);
      return {
        ...note,
        id: crypto.randomUUID(),
        start: Math.max(0, (clippedStart - start) / rate),
        duration: Math.max(0.05, (clippedEnd - clippedStart) / rate)
      };
    });

  return Array.from({ length: repeatCount }, (_, repeat) =>
    base.map((note) => ({
      ...note,
      id: crypto.randomUUID(),
      start: note.start + repeat * passageDuration
    }))
  ).flat();
}

function formatSeconds(value: number) {
  const safe = Math.max(0, Number.isFinite(value) ? value : 0);
  const minutes = Math.floor(safe / 60);
  const seconds = Math.floor(safe % 60)
    .toString()
    .padStart(2, '0');
  return `${minutes}:${seconds}`;
}

export function ChoirPage() {
  const { t, language } = useI18n();
  const x = (key: string) => proText(language, key);
  const { project, setProject, settings } = useApp();
  const audio = useAudioEngine(settings.referenceA4, settings.processingMode, settings.gateMultiplier);
  const [ensemble, setEnsemble] = useState<EnsembleDocument | null>(null);
  const [partId, setPartId] = useState('');
  const [myPart, setMyPart] = useState(100);
  const [other, setOther] = useState(22);
  const [piano, setPiano] = useState(45);
  const [metronome, setMetronome] = useState(28);
  const [speed, setSpeed] = useState(1);
  const [passageStart, setPassageStart] = useState(0);
  const [passageEnd, setPassageEnd] = useState(0);
  const [repetitions, setRepetitions] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [practicing, setPracticing] = useState(false);
  const practicingRef = useRef(false);
  const [message, setMessage] = useState('');
  const [target, setTarget] = useState('—');
  const [deviation, setDeviation] = useState<number | null>(null);
  const [result, setResult] = useState<{
    accuracy: number;
    hitRate: number;
    average: number;
  } | null>(null);
  const players = useRef<TonePlayer[]>([]);
  const timer = useRef<number | null>(null);
  const practiceStartFrame = useRef<number | null>(null);
  const practiceStartedAt = useRef(0);
  const evaluation = useRef({ samples: 0, cents: 0, hits: 0 });

  const parts: EnsemblePart[] = ensemble?.parts.length
    ? ensemble.parts
    : [{ id: 'current', name: t('choir.myPart'), notes: project.score.notes }];
  const selectedPartId = partId || parts[0]?.id || '';
  const selectedPart = parts.find((part) => part.id === selectedPartId) || parts[0];
  const sourceDuration = useMemo(
    () => parts.flatMap((part) => part.notes).reduce((max, note) => Math.max(max, note.start + note.duration), 0),
    [parts]
  );

  useEffect(() => {
    setPassageEnd((current) => {
      if (!sourceDuration) return 0;
      if (current <= 0 || current > sourceDuration) return sourceDuration;
      return current;
    });
    setPassageStart((current) => Math.min(current, Math.max(0, sourceDuration - 0.05)));
  }, [sourceDuration]);

  const safePassageEnd = Math.max(
    passageStart + 0.05,
    Math.min(sourceDuration || 0.05, passageEnd || sourceDuration || 0.05)
  );
  const practiceNotes = useMemo(
    () => transformRehearsalNotes(selectedPart?.notes || [], passageStart, safePassageEnd, speed, repetitions),
    [passageStart, repetitions, safePassageEnd, selectedPart, speed]
  );
  const previewScore = useMemo(
    () => ({
      ...project.score,
      title: ensemble?.title || project.score.title,
      tempo: Math.max(20, Math.round((ensemble?.tempo || project.score.tempo) * speed)),
      notes: practiceNotes
    }),
    [ensemble, practiceNotes, project.score, speed]
  );
  const svg = useMemo(() => renderScoreSvg(previewScore), [previewScore]);

  const finalizePractice = () => {
    const current = evaluation.current;
    practicingRef.current = false;
    setPracticing(false);
    if (current.samples) {
      const average = current.cents / current.samples;
      const completed = {
        accuracy: Math.max(0, Math.round(100 - average * 1.15)),
        hitRate: Math.round((current.hits / current.samples) * 100),
        average
      };
      setResult(completed);
      void saveTrainingSession({
        id: crypto.randomUUID(),
        projectId: project.id,
        exerciseId: `choir-${selectedPart?.id || 'part'}`,
        exerciseName: `Choir · ${selectedPart?.name || 'Part'}`,
        category: 'pitch',
        difficulty: 'intermediate',
        startedAt: practiceStartedAt.current || Date.now(),
        completedAt: Date.now(),
        durationSeconds: Math.max(1, (Date.now() - practiceStartedAt.current) / 1000),
        accuracy: completed.accuracy,
        hitRate: completed.hitRate,
        averageCents: average,
        score: completed.accuracy
      }).catch(() => undefined);
    }
  };

  const stopAll = (finalize = true) => {
    players.current.forEach((player) => player.stop());
    players.current = [];
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = null;
    setPlaying(false);
    if (practicingRef.current && finalize) finalizePractice();
  };

  useEffect(() => () => stopAll(false), []);

  useEffect(
    () =>
      audio.subscribePitch((frame) => {
        if (!practicing || !practiceNotes.length || frame.confidence < 0.55) return;
        if (practiceStartFrame.current === null) practiceStartFrame.current = frame.timestamp;
        const elapsed = frame.timestamp - practiceStartFrame.current;
        const expected = practiceNotes.find((note) => elapsed >= note.start && elapsed <= note.start + note.duration);
        if (!expected) return;
        const cents = (frame.midi - expected.midi) * 100;
        setTarget(`${expected.note}${expected.octave}`);
        setDeviation(cents);
        evaluation.current.samples += 1;
        evaluation.current.cents += Math.abs(cents);
        if (Math.abs(cents) <= 50) evaluation.current.hits += 1;
      }),
    [audio, practiceNotes, practicing]
  );

  const importFile = async (file: File) => {
    try {
      stopAll(false);
      const isMidi = /\.midi?$/i.test(file.name);
      const buffer = isMidi ? await file.arrayBuffer() : null;
      const text = !isMidi ? await file.text() : '';
      const nextEnsemble = isMidi ? importMidiEnsemble(buffer!) : importMusicXmlEnsemble(text);
      const score = isMidi ? importMidi(buffer!) : importMusicXml(text);
      const importedDuration = nextEnsemble.parts
        .flatMap((part) => part.notes)
        .reduce((max, note) => Math.max(max, note.start + note.duration), 0);
      setEnsemble(nextEnsemble);
      setPartId(nextEnsemble.parts[0]?.id || '');
      setPassageStart(0);
      setPassageEnd(importedDuration);
      setRepetitions(1);
      setSpeed(1);
      setProject((current) => ({ ...current, score, updatedAt: Date.now() }));
      setMessage(`${nextEnsemble.parts.length} · ${t('choir.loaded')}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t('choir.importFailed'));
    }
  };

  const transformPart = (part: EnsemblePart) =>
    transformRehearsalNotes(part.notes, passageStart, safePassageEnd, speed, repetitions);

  const playMix = async (): Promise<number> => {
    if (!parts.some((part) => part.notes.length) || !selectedPart) return 0;
    setPlaying(true);
    const others = parts.filter((part) => part.id !== selectedPart.id);
    const created: TonePlayer[] = [];
    const selectedNotes = transformPart(selectedPart);

    if (myPart > 0 && selectedNotes.length) {
      const selectedPlayer = new TonePlayer();
      created.push(selectedPlayer);
      void selectedPlayer.play(selectedNotes, Math.max(0.001, (myPart / 100) * 0.26), 'choir');
    }
    if (other > 0) {
      for (const part of others) {
        const notes = transformPart(part);
        if (!notes.length) continue;
        const player = new TonePlayer();
        created.push(player);
        void player.play(notes, Math.max(0.001, (other / 100) * 0.09), 'choir');
      }
    }
    const allNotes = parts.flatMap(transformPart);
    if (piano > 0 && allNotes.length) {
      const player = new TonePlayer();
      created.push(player);
      void player.play(allNotes, Math.max(0.001, (piano / 100) * 0.055), 'piano');
    }
    const end = allNotes.reduce((max, note) => Math.max(max, note.start + note.duration), 0);
    if (metronome > 0 && end > 0) {
      const player = new TonePlayer();
      created.push(player);
      void player.play(
        buildMetronome(end, (ensemble?.tempo || project.score.tempo) * speed),
        Math.max(0.001, (metronome / 100) * 0.12),
        'square'
      );
    }
    players.current = created;
    return end;
  };

  const togglePlay = async () => {
    if (playing) {
      stopAll();
      return;
    }
    const end = await playMix();
    if (end > 0) timer.current = window.setTimeout(() => stopAll(), end * 1000 + 300);
  };

  const startPartPractice = async () => {
    if (!practiceNotes.length) return;
    stopAll(false);
    if (!audio.state.active) {
      await audio.engine.start({
        deviceId: settings.microphoneId || undefined,
        processingMode: settings.processingMode,
        referenceA4: settings.referenceA4,
        gateMultiplier: settings.gateMultiplier,
        noiseFloor: project.settings.noiseFloor,
        audioPreferences: settings.audio
      });
    }
    evaluation.current = { samples: 0, cents: 0, hits: 0 };
    practiceStartedAt.current = Date.now();
    practiceStartFrame.current = null;
    setResult(null);
    setDeviation(null);
    setTarget('—');
    practicingRef.current = true;
    setPracticing(true);
    const end = await playMix();
    if (end > 0) timer.current = window.setTimeout(() => stopAll(), end * 1000 + 350);
  };

  const resetPassage = () => {
    stopAll(false);
    setPassageStart(0);
    setPassageEnd(sourceDuration);
    setRepetitions(1);
    setSpeed(1);
  };

  return (
    <div className="page">
      <Seo title={t('choir.title')} description={t('choir.subtitle')} path="/choir" />
      <div className="page-header">
        <div className="page-title-wrap">
          <div className="eyebrow">OpenVox Ensemble</div>
          <h1>{t('choir.title')}</h1>
          <p>{t('choir.subtitle')}</p>
        </div>
      </div>
      <div className="choir-grid">
        <section className="card panel span-4">
          <label className="button button-primary button-wide file-button">
            <Icon name="upload" />
            {t('choir.import')}
            <input
              type="file"
              accept=".musicxml,.xml,.mid,.midi"
              onChange={(event) => event.target.files?.[0] && void importFile(event.target.files[0])}
            />
          </label>
          <div className="field" style={{ marginTop: 18 }}>
            <label>{t('choir.part')}</label>
            <select
              aria-label={t('choir.part')}
              value={selectedPartId}
              onChange={(event) => setPartId(event.target.value)}
            >
              {parts.map((part) => (
                <option key={part.id} value={part.id}>
                  {part.name}
                </option>
              ))}
            </select>
          </div>

          {[
            [t('choir.myPart'), myPart, setMyPart],
            [t('choir.other'), other, setOther],
            [t('choir.piano'), piano, setPiano],
            [t('choir.metronome'), metronome, setMetronome]
          ].map(([label, value, setter]) => (
            <div className="slider-row" key={String(label)}>
              <span className="hint">{String(label)}</span>
              <input
                aria-label={String(label)}
                type="range"
                min="0"
                max="100"
                value={Number(value)}
                onChange={(event) =>
                  (setter as React.Dispatch<React.SetStateAction<number>>)(Number(event.target.value))
                }
              />
              <strong>{Number(value)}</strong>
            </div>
          ))}

          <div className="choir-passage-panel">
            <div className="card-title">
              <h2>{x('choir.passage')}</h2>
              <span className="badge">
                {formatSeconds(passageStart)}–{formatSeconds(safePassageEnd)}
              </span>
            </div>
            <label className="field">
              <span>
                {x('choir.speed')} · {Math.round(speed * 100)}%
              </span>
              <input
                aria-label={x('choir.speed')}
                type="range"
                min="0.5"
                max="1.5"
                step="0.05"
                value={speed}
                onChange={(event) => setSpeed(Number(event.target.value))}
              />
            </label>
            <div className="field-row">
              <label className="field">
                <span>{x('choir.passageStart')}</span>
                <input
                  aria-label={x('choir.passageStart')}
                  type="number"
                  min="0"
                  max={Math.max(0, safePassageEnd - 0.05)}
                  step="0.1"
                  value={passageStart}
                  onChange={(event) =>
                    setPassageStart(Math.max(0, Math.min(Number(event.target.value), safePassageEnd - 0.05)))
                  }
                />
              </label>
              <label className="field">
                <span>{x('choir.passageEnd')}</span>
                <input
                  aria-label={x('choir.passageEnd')}
                  type="number"
                  min={passageStart + 0.05}
                  max={Math.max(passageStart + 0.05, sourceDuration)}
                  step="0.1"
                  value={safePassageEnd}
                  onChange={(event) =>
                    setPassageEnd(
                      Math.max(
                        passageStart + 0.05,
                        Math.min(Number(event.target.value), sourceDuration || passageStart + 0.05)
                      )
                    )
                  }
                />
              </label>
            </div>
            <label className="field">
              <span>{x('choir.repetitions')}</span>
              <select
                aria-label={x('choir.repetitions')}
                value={repetitions}
                onChange={(event) => setRepetitions(Number(event.target.value))}
              >
                {Array.from({ length: 8 }, (_, index) => index + 1).map((count) => (
                  <option key={count} value={count}>
                    {count}×
                  </option>
                ))}
              </select>
            </label>
            <button className="mini-button" onClick={resetPassage}>
              {x('choir.fullScore')}
            </button>
          </div>

          <div className="action-row">
            <button
              className={`button ${playing && !practicing ? 'button-danger' : ''}`}
              disabled={practicing || !practiceNotes.length}
              onClick={() => void togglePlay()}
            >
              <Icon name={playing && !practicing ? 'stop' : 'play'} />
              {playing && !practicing ? t('common.stop') : t('choir.play')}
            </button>
            {practicing ? (
              <button className="button button-danger" onClick={() => stopAll()}>
                <Icon name="stop" />
                {t('choir.finishPractice')}
              </button>
            ) : (
              <button
                className="button button-primary"
                disabled={!practiceNotes.length}
                onClick={() => void startPartPractice()}
              >
                <Icon name="mic" />
                {t('choir.practicePart')}
              </button>
            )}
          </div>
          <p className="hint">{t('practice.headphones')}</p>
          {audio.error && (
            <p className="hint" style={{ color: 'var(--red)' }}>
              {audio.error}
            </p>
          )}
          {message && (
            <p className="hint" style={{ marginTop: 12 }}>
              {message}
            </p>
          )}
          <p className="hint" style={{ marginTop: 18 }}>
            {t('choir.info')}
          </p>
        </section>
        <section className="card score-preview-card span-8">
          <div className="card-title">
            <h2>{ensemble?.title || project.score.title}</h2>
            <span className="badge">{selectedPart?.name || t('choir.part')}</span>
          </div>
          <ScoreViewport svg={svg} label={t('choir.title')} compact />
          <div className="practice-evaluation">
            <div className="metric">
              <span>{t('practice.target')}</span>
              <strong>{target}</strong>
            </div>
            <div className="metric">
              <span>{t('practice.deviation')}</span>
              <strong>{deviation === null ? '—' : `${deviation > 0 ? '+' : ''}${Math.round(deviation)} ¢`}</strong>
            </div>
            <div className="metric">
              <span>{t('practice.accuracy')}</span>
              <strong>{result ? `${result.accuracy}%` : '—'}</strong>
            </div>
            <div className="metric">
              <span>{t('practice.hitRate')}</span>
              <strong>{result ? `${result.hitRate}%` : '—'}</strong>
            </div>
          </div>
          {result && (
            <p className="hint">
              {t('practice.averageDeviation')}: {result.average.toFixed(1)} ¢
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
