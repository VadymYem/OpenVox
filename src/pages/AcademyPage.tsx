import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../app/AppContext';
import { Icon } from '../components/Icon';
import { Seo } from '../components/Seo';
import { ScoreViewport } from '../components/ScoreViewport';
import { TonePlayer } from '../core/music/player';
import { midiToNote } from '../core/music/notes';
import { renderScoreSvg } from '../core/music/scoreRenderer';
import {
  buildExerciseNotes,
  buildSessionPlan,
  TRAINING_LIBRARY,
  type TrainingExerciseDefinition
} from '../core/training/trainingLibrary';
import { getVocalGuide } from '../core/training/vocalGuide';
import { saveTrainingSession } from '../core/storage/database';
import { useAudioEngine } from '../hooks/useAudioEngine';
import { useI18n } from '../i18n/I18nContext';
import { localizedExercise, proText, trainingCategoryName, trainingDifficultyName } from '../i18n/proTranslations';
import type { MusicalNoteEvent, ScoreDocument, TrainingCategory, TrainingDifficulty } from '../types';

const CATEGORIES: TrainingCategory[] = [
  'warmup',
  'pitch',
  'agility',
  'breath',
  'resonance',
  'articulation',
  'ear',
  'rhythm',
  'dynamics',
  'cooldown'
];

function makeSingleNote(midi: number, duration = 1): MusicalNoteEvent[] {
  const note = midiToNote(midi);
  return [
    {
      id: crypto.randomUUID(),
      midi,
      note: note.note,
      octave: note.octave,
      start: 0,
      duration,
      velocity: 90,
      confidence: 1
    }
  ];
}

function createSightScore(rootMidi: number, difficulty: TrainingDifficulty): ScoreDocument {
  const count = difficulty === 'beginner' ? 8 : difficulty === 'intermediate' ? 12 : 16;
  const scale = [0, 2, 4, 5, 7, 9, 11, 12];
  const allowedStep = difficulty === 'beginner' ? 2 : difficulty === 'intermediate' ? 3 : 5;
  let index = Math.min(3, scale.length - 1);
  const tempo = difficulty === 'beginner' ? 66 : difficulty === 'intermediate' ? 78 : 92;
  const beat = 60 / tempo;
  const notes: MusicalNoteEvent[] = [];
  for (let i = 0; i < count; i += 1) {
    if (i > 0) {
      const delta = Math.floor(Math.random() * (allowedStep * 2 + 1)) - allowedStep;
      index = Math.max(0, Math.min(scale.length - 1, index + delta));
    }
    const midi = rootMidi + scale[index];
    const note = midiToNote(midi);
    notes.push({
      id: crypto.randomUUID(),
      midi,
      note: note.note,
      octave: note.octave,
      start: i * beat,
      duration: beat * 0.82,
      velocity: 88,
      confidence: 1
    });
  }
  return {
    id: crypto.randomUUID(),
    title: 'Sight Singing',
    composer: 'OpenVox',
    tempo,
    timeSignature: [4, 4],
    keyFifths: 0,
    notes,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
}

export function AcademyPage() {
  const { settings, project } = useApp();
  const { language } = useI18n();
  const x = (key: string) => proText(language, key);
  const audio = useAudioEngine(settings.referenceA4, settings.processingMode, settings.gateMultiplier);
  const player = useRef(new TonePlayer());
  const [tab, setTab] = useState<'planner' | 'pitch' | 'breath' | 'ear' | 'rhythm' | 'sight' | 'guide' | 'library'>(
    'planner'
  );
  const [minutes, setMinutes] = useState(25);
  const [difficulty, setDifficulty] = useState<TrainingDifficulty>('beginner');
  const [focus, setFocus] = useState<TrainingCategory | 'balanced'>('balanced');
  const [rootMidi, setRootMidi] = useState(60);
  const [targetMidi, setTargetMidi] = useState(60);
  const [pitchRunning, setPitchRunning] = useState(false);
  const [pitchSamples, setPitchSamples] = useState<number[]>([]);
  const pitchStartedAt = useRef(0);
  const [breathPattern, setBreathPattern] = useState<[number, number, number, number]>([4, 2, 8, 2]);
  const [breathRounds, setBreathRounds] = useState(4);
  const [breathRunning, setBreathRunning] = useState(false);
  const [breathPhase, setBreathPhase] = useState(0);
  const [breathRemaining, setBreathRemaining] = useState(4);
  const breathStartedAt = useRef(0);
  const breathCompleted = useRef(false);
  const [earScore, setEarScore] = useState({ correct: 0, total: 0 });
  const [earQuestion, setEarQuestion] = useState<{ root: number; interval: number } | null>(null);
  const earStartedAt = useRef(0);
  const [rhythmBpm, setRhythmBpm] = useState(84);
  const [taps, setTaps] = useState<number[]>([]);
  const rhythmStartedAt = useRef(0);
  const [filterCategory, setFilterCategory] = useState<TrainingCategory | 'all'>('all');
  const [message, setMessage] = useState('');
  const [sightScore, setSightScore] = useState<ScoreDocument>(() => createSightScore(60, 'beginner'));
  const [sightRunning, setSightRunning] = useState(false);
  const [sightTarget, setSightTarget] = useState('—');
  const sightStartedAt = useRef(0);
  const sightFrameOrigin = useRef<number | null>(null);
  const sightEvaluation = useRef({ samples: 0, centsTotal: 0, hits: 0, best: Number.POSITIVE_INFINITY });

  const plan = useMemo(() => buildSessionPlan(minutes, difficulty, focus), [minutes, difficulty, focus]);
  const displayPlan = useMemo(() => plan.map((exercise) => localizedExercise(language, exercise)), [plan, language]);
  const vocalGuide = getVocalGuide(language);
  const filteredLibrary = (
    filterCategory === 'all' ? TRAINING_LIBRARY : TRAINING_LIBRARY.filter((item) => item.category === filterCategory)
  ).map((exercise) => localizedExercise(language, exercise));
  const target = midiToNote(targetMidi);
  const targetLabel = `${target.note}${target.octave}`;
  const sightSvg = useMemo(() => renderScoreSvg(sightScore, 1000), [sightScore]);

  useEffect(
    () =>
      audio.subscribePitch((frame) => {
        if (frame.confidence < settings.audio.confidenceThreshold) return;
        if (pitchRunning)
          setPitchSamples((current) =>
            current.length > 1000 ? [...current.slice(-800), frame.midi] : [...current, frame.midi]
          );
        if (sightRunning) {
          if (sightFrameOrigin.current === null) sightFrameOrigin.current = frame.timestamp;
          const elapsed = frame.timestamp - sightFrameOrigin.current;
          const expected = sightScore.notes.find(
            (note) => elapsed >= note.start && elapsed <= note.start + note.duration
          );
          if (!expected) return;
          const cents = (frame.midi - expected.midi) * 100;
          setSightTarget(`${expected.note}${expected.octave}`);
          const current = sightEvaluation.current;
          current.samples += 1;
          current.centsTotal += Math.abs(cents);
          current.best = Math.min(current.best, Math.abs(cents));
          if (Math.abs(cents) <= 50) current.hits += 1;
        }
      }),
    [audio, pitchRunning, sightRunning, sightScore, settings.audio.confidenceThreshold]
  );

  useEffect(() => {
    if (!breathRunning) return;
    const durations = breathPattern;
    const timer = window.setInterval(() => {
      setBreathRemaining((remaining) => {
        if (remaining > 1) return remaining - 1;
        setBreathPhase((phase) => {
          const next = phase + 1;
          if (next >= breathRounds * 4) {
            breathCompleted.current = true;
            setBreathRunning(false);
            return phase;
          }
          return next;
        });
        const nextIndex = (breathPhase + 1) % 4;
        return durations[nextIndex];
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [breathRunning, breathPattern, breathRounds, breathPhase]);

  useEffect(() => {
    if (breathRunning || !breathCompleted.current || !breathStartedAt.current) return;
    breathCompleted.current = false;
    const completedAt = Date.now();
    void saveTrainingSession({
      id: crypto.randomUUID(),
      projectId: project.id,
      exerciseId: 'academy-breath-cycle',
      exerciseName: x('academy.breathCycle'),
      category: 'breath',
      difficulty,
      startedAt: breathStartedAt.current,
      completedAt,
      durationSeconds: Math.max(1, (completedAt - breathStartedAt.current) / 1000),
      score: 100
    })
      .then(() => setMessage(x('academy.breathSaved')))
      .catch(() => undefined);
    breathStartedAt.current = 0;
  }, [breathRunning, difficulty, project.id, language]);

  useEffect(() => () => player.current.stop(), []);

  const startMic = async () => {
    if (audio.state.active) return;
    await audio.engine.start({
      deviceId: settings.microphoneId || undefined,
      processingMode: settings.processingMode,
      referenceA4: settings.referenceA4,
      gateMultiplier: settings.gateMultiplier,
      noiseFloor: project.settings.noiseFloor,
      audioPreferences: settings.audio
    });
  };

  const playExercise = async (exercise: TrainingExerciseDefinition) => {
    const notes = buildExerciseNotes(exercise, rootMidi);
    if (!notes.length) {
      setMessage(exercise.instruction);
      return;
    }
    await player.current.play(notes, 0.16, 'vocal');
    setMessage(`${exercise.name}: ${exercise.instruction}`);
  };

  const startPitchMatch = async () => {
    await startMic();
    setPitchSamples([]);
    pitchStartedAt.current = Date.now();
    setPitchRunning(true);
    await player.current.play(makeSingleNote(targetMidi, 0.9), 0.2, 'reference');
  };

  const finishPitchMatch = async () => {
    setPitchRunning(false);
    const deviations = pitchSamples.map((midi) => Math.abs((midi - targetMidi) * 100)).filter(Number.isFinite);
    if (!deviations.length) {
      setMessage('Not enough stable pitch data. Try again with a sustained clear tone.');
      return;
    }
    const average = deviations.reduce((sum, value) => sum + value, 0) / deviations.length;
    const hits = deviations.filter((value) => value <= 25).length;
    const accuracy = Math.max(0, Math.round(100 - average * 1.4));
    await saveTrainingSession({
      id: crypto.randomUUID(),
      projectId: project.id,
      exerciseId: 'academy-pitch-match',
      exerciseName: 'Pitch match',
      category: 'pitch',
      difficulty,
      startedAt: pitchStartedAt.current || Date.now(),
      completedAt: Date.now(),
      durationSeconds: Math.max(1, (Date.now() - pitchStartedAt.current) / 1000),
      accuracy,
      hitRate: Math.round((hits / deviations.length) * 100),
      averageCents: average,
      bestCents: Math.min(...deviations),
      score: accuracy,
      targetNote: targetLabel
    });
    setMessage(`Pitch match saved: ${accuracy}% accuracy · ${average.toFixed(1)} cents average deviation.`);
  };

  const startBreath = () => {
    breathStartedAt.current = Date.now();
    breathCompleted.current = false;
    setBreathPhase(0);
    setBreathRemaining(breathPattern[0]);
    setBreathRunning(true);
  };

  const newEarQuestion = async () => {
    earStartedAt.current ||= Date.now();
    const intervals =
      difficulty === 'beginner'
        ? [0, 2, 4, 5, 7, 12]
        : difficulty === 'intermediate'
          ? [0, 1, 2, 3, 4, 5, 7, 8, 9, 12]
          : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    const root = 48 + Math.floor(Math.random() * 13);
    const interval = intervals[Math.floor(Math.random() * intervals.length)];
    setEarQuestion({ root, interval });
    await player.current.play(
      [
        ...makeSingleNote(root, 0.65),
        ...makeSingleNote(root + interval, 0.65).map((note) => ({ ...note, id: crypto.randomUUID(), start: 0.9 }))
      ],
      0.18,
      'sine'
    );
  };

  const answerEar = (interval: number) => {
    if (!earQuestion) return;
    setEarScore((score) => ({
      correct: score.correct + (interval === earQuestion.interval ? 1 : 0),
      total: score.total + 1
    }));
    setMessage(
      interval === earQuestion.interval
        ? x('academy.correct')
        : `${x('academy.targetInterval')}: ${earQuestion.interval} ${x('academy.semitones')}.`
    );
    setEarQuestion(null);
  };

  const saveEarTraining = async () => {
    if (!earScore.total) {
      setMessage(x('academy.earNoAnswers'));
      return;
    }
    const accuracy = Math.round((earScore.correct / earScore.total) * 100);
    const completedAt = Date.now();
    await saveTrainingSession({
      id: crypto.randomUUID(),
      projectId: project.id,
      exerciseId: 'academy-interval-ear',
      exerciseName: x('academy.intervalTrainer'),
      category: 'ear',
      difficulty,
      startedAt: earStartedAt.current || completedAt,
      completedAt,
      durationSeconds: Math.max(1, (completedAt - (earStartedAt.current || completedAt)) / 1000),
      accuracy,
      hitRate: accuracy,
      score: accuracy
    });
    setMessage(`${x('academy.earSaved')}: ${accuracy}%`);
    setEarScore({ correct: 0, total: 0 });
    earStartedAt.current = 0;
  };

  const tapBeat = () => {
    rhythmStartedAt.current ||= Date.now();
    const now = performance.now();
    setTaps((current) => [...current.slice(-15), now]);
  };
  const tapTempo = useMemo(() => {
    if (taps.length < 2) return null;
    const intervals = taps
      .slice(1)
      .map((value, index) => value - taps[index])
      .filter((value) => value > 150 && value < 3000);
    if (!intervals.length) return null;
    const average = intervals.reduce((sum, value) => sum + value, 0) / intervals.length;
    return 60000 / average;
  }, [taps]);
  const rhythmDeviation = tapTempo ? Math.abs(tapTempo - rhythmBpm) : null;

  const saveRhythmTraining = async () => {
    if (rhythmDeviation === null || taps.length < 2) {
      setMessage(x('academy.rhythmNoData'));
      return;
    }
    const accuracy = Math.max(0, Math.round(100 - rhythmDeviation * 4));
    const completedAt = Date.now();
    await saveTrainingSession({
      id: crypto.randomUUID(),
      projectId: project.id,
      exerciseId: 'academy-pulse',
      exerciseName: x('academy.pulseTarget'),
      category: 'rhythm',
      difficulty,
      startedAt: rhythmStartedAt.current || completedAt,
      completedAt,
      durationSeconds: Math.max(1, (completedAt - (rhythmStartedAt.current || completedAt)) / 1000),
      accuracy,
      score: accuracy
    });
    setMessage(`${x('academy.rhythmSaved')}: ${accuracy}%`);
    setTaps([]);
    rhythmStartedAt.current = 0;
  };

  const newSightMelody = () => {
    setSightRunning(false);
    sightFrameOrigin.current = null;
    sightEvaluation.current = { samples: 0, centsTotal: 0, hits: 0, best: Number.POSITIVE_INFINITY };
    setSightTarget('—');
    setSightScore(createSightScore(rootMidi, difficulty));
  };

  const startSight = async () => {
    await startMic();
    sightFrameOrigin.current = null;
    sightEvaluation.current = { samples: 0, centsTotal: 0, hits: 0, best: Number.POSITIVE_INFINITY };
    sightStartedAt.current = Date.now();
    setSightRunning(true);
  };

  const finishSight = async () => {
    setSightRunning(false);
    const current = sightEvaluation.current;
    if (!current.samples) {
      setMessage(x('status.noData'));
      return;
    }
    const average = current.centsTotal / current.samples;
    const accuracy = Math.max(0, Math.round(100 - average * 1.1));
    const hitRate = Math.round((current.hits / current.samples) * 100);
    await saveTrainingSession({
      id: crypto.randomUUID(),
      projectId: project.id,
      exerciseId: 'academy-sight-singing',
      exerciseName: x('academy.sightTitle'),
      category: 'ear',
      difficulty,
      startedAt: sightStartedAt.current || Date.now(),
      completedAt: Date.now(),
      durationSeconds: Math.max(1, (Date.now() - sightStartedAt.current) / 1000),
      accuracy,
      hitRate,
      averageCents: average,
      bestCents: Number.isFinite(current.best) ? current.best : undefined,
      score: Math.round((accuracy + hitRate) / 2)
    });
    setMessage(`${x('academy.sightSaved')}: ${accuracy}% · ${hitRate}%`);
  };

  const phaseNames = [x('academy.inhale'), x('academy.hold'), x('academy.exhale'), x('academy.recover')];
  const activeBreathPhase = breathPhase % 4;

  return (
    <div className="page">
      <Seo
        title="Vocal Academy"
        description="Structured vocal training, pitch matching, breath pacing, ear training, rhythm work and exercise planning in OpenVox Studio."
        path="/academy"
      />
      <div className="page-header">
        <div className="page-title-wrap">
          <div className="eyebrow">{x('academy.eyebrow')}</div>
          <h1>{x('academy.title')}</h1>
          <p>{x('academy.body')}</p>
        </div>
      </div>
      <div className="academy-tabs" role="tablist" aria-label="Vocal Academy tools">
        {(
          [
            ['planner', 'academy.tab.planner'],
            ['pitch', 'academy.tab.pitch'],
            ['breath', 'academy.tab.breath'],
            ['ear', 'academy.tab.ear'],
            ['rhythm', 'academy.tab.rhythm'],
            ['sight', 'academy.tab.sight'],
            ['guide', 'academy.tab.guide'],
            ['library', 'academy.tab.library']
          ] as const
        ).map(([id, key]) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            className={`seg-button ${tab === id ? 'active' : ''}`}
            onClick={() => setTab(id)}
          >
            {x(key)}
          </button>
        ))}
      </div>

      {tab === 'planner' && (
        <div className="academy-grid">
          <section className="card panel span-4">
            <div className="card-title">
              <h2>{x('academy.practicePlan')}</h2>
              <span className="badge">{x('academy.local')}</span>
            </div>
            <div className="field">
              <label>{x('academy.sessionLength')}</label>
              <input
                aria-label={x('academy.sessionLength')}
                type="range"
                min="10"
                max="60"
                step="5"
                value={minutes}
                onChange={(e) => setMinutes(Number(e.target.value))}
              />
              <span className="hint">
                {minutes} {x('academy.minutes')}
              </span>
            </div>
            <div className="field">
              <label>{x('academy.difficulty')}</label>
              <select
                aria-label={x('academy.difficulty')}
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as TrainingDifficulty)}
              >
                <option value="beginner">{x('academy.beginner')}</option>
                <option value="intermediate">{x('academy.intermediate')}</option>
                <option value="advanced">{x('academy.advanced')}</option>
              </select>
            </div>
            <div className="field">
              <label>{x('academy.primaryFocus')}</label>
              <select
                aria-label={x('academy.primaryFocus')}
                value={focus}
                onChange={(e) => setFocus(e.target.value as TrainingCategory | 'balanced')}
              >
                <option value="balanced">{x('academy.balanced')}</option>
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {trainingCategoryName(language, category)}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>{x('academy.referenceRoot')}</label>
              <select
                aria-label={x('academy.referenceRoot')}
                value={rootMidi}
                onChange={(e) => setRootMidi(Number(e.target.value))}
              >
                {Array.from({ length: 25 }, (_, i) => 48 + i).map((midi) => {
                  const n = midiToNote(midi);
                  return (
                    <option key={midi} value={midi}>
                      {n.note}
                      {n.octave}
                    </option>
                  );
                })}
              </select>
            </div>
          </section>
          <section className="card panel span-8">
            <div className="card-title">
              <h2>{x('academy.generated')}</h2>
              <span className="badge">{displayPlan.reduce((s, e) => s + e.minutes, 0)} min</span>
            </div>
            <div className="session-plan">
              {displayPlan.map((exercise, index) => (
                <article className="session-step" key={exercise.id}>
                  <span className="step-index">{index + 1}</span>
                  <div>
                    <strong>{exercise.name}</strong>
                    <small>
                      {trainingCategoryName(language, exercise.category)} · {exercise.minutes} min ·{' '}
                      {trainingDifficultyName(language, exercise.difficulty)}
                    </small>
                    <p>{exercise.description}</p>
                  </div>
                  <button
                    className="mini-button"
                    onClick={() => void playExercise(exercise)}
                    disabled={!exercise.intervals?.length}
                  >
                    <Icon name="play" />
                    {x('academy.preview')}
                  </button>
                </article>
              ))}
            </div>
          </section>
        </div>
      )}

      {tab === 'pitch' && (
        <div className="academy-grid">
          <section className="card panel span-4">
            <div className="card-title">
              <h2>{x('academy.targetPitch')}</h2>
              <span className="badge">{x('academy.hitZone')}</span>
            </div>
            <div className="pitch-target-display">{targetLabel}</div>
            <input
              aria-label={x('academy.targetPitch')}
              type="range"
              min="36"
              max="84"
              value={targetMidi}
              onChange={(e) => setTargetMidi(Number(e.target.value))}
            />
            <div className="toolbar">
              <button className="button" onClick={() => void player.current.play(makeSingleNote(targetMidi, 0.9), 0.2)}>
                <Icon name="play" />
                {x('academy.hearTarget')}
              </button>
              <button
                className={`button ${pitchRunning ? 'button-danger' : 'button-primary'}`}
                onClick={() => void (pitchRunning ? finishPitchMatch() : startPitchMatch())}
              >
                <Icon name={pitchRunning ? 'stop' : 'mic'} />
                {pitchRunning ? x('academy.finish') : x('academy.singTarget')}
              </button>
            </div>
          </section>
          <section className="card panel span-8">
            <div className="card-title">
              <h2>{x('academy.liveIntonation')}</h2>
              <span className="badge">
                {pitchSamples.length} {x('academy.samples')}
              </span>
            </div>
            <div className="tuner-readout">
              <strong>{audio.pitch ? `${audio.pitch.note}${audio.pitch.octave}` : '—'}</strong>
              <span>
                {audio.pitch
                  ? `${((audio.pitch.midi - targetMidi) * 100).toFixed(1)} ${x('academy.fromTarget')}`
                  : x('academy.startPitch')}
              </span>
            </div>
            <div className="cent-gauge">
              <span className="cent-center" />
              <span
                className="cent-cursor"
                style={{
                  left: `${Math.max(0, Math.min(100, 50 + ((audio.pitch?.midi ?? targetMidi) - targetMidi) * 50))}%`
                }}
              />
            </div>
          </section>
        </div>
      )}

      {tab === 'breath' && (
        <div className="academy-grid">
          <section className="card panel span-5">
            <div className="card-title">
              <h2>{x('academy.breathCycle')}</h2>
              <span className="badge">{x('academy.comfortFirst')}</span>
            </div>
            <div className="field-row">
              {([x('academy.inhale'), x('academy.hold'), x('academy.exhale'), x('academy.recover')] as const).map(
                (label, index) => (
                  <div className="field" key={label}>
                    <label>{label} (s)</label>
                    <input
                      aria-label={`${label} (s)`}
                      type="number"
                      min="0"
                      max="30"
                      value={breathPattern[index]}
                      onChange={(e) => {
                        const n = [...breathPattern] as [number, number, number, number];
                        n[index] = Math.max(0, Number(e.target.value));
                        setBreathPattern(n);
                      }}
                    />
                  </div>
                )
              )}
            </div>
            <div className="field">
              <label>{x('academy.rounds')}</label>
              <input
                aria-label={x('academy.rounds')}
                type="number"
                min="1"
                max="12"
                value={breathRounds}
                onChange={(e) => setBreathRounds(Math.max(1, Number(e.target.value)))}
              />
            </div>
            <button
              className={`button button-wide ${breathRunning ? 'button-danger' : 'button-primary'}`}
              onClick={() => (breathRunning ? setBreathRunning(false) : startBreath())}
            >
              {breathRunning ? x('academy.stopCycle') : x('academy.startCycle')}
            </button>
            <p className="hint">{x('academy.breathSafety')}</p>
          </section>
          <section className="card panel span-7 breath-stage">
            <div className="breath-orb">
              <strong>{breathRunning ? phaseNames[activeBreathPhase] : x('academy.ready')}</strong>
              <span>{breathRunning ? breathRemaining : '—'}</span>
            </div>
            <p>
              {x('academy.round')} {breathRunning ? Math.floor(breathPhase / 4) + 1 : 0} / {breathRounds}
            </p>
          </section>
        </div>
      )}

      {tab === 'ear' && (
        <div className="academy-grid">
          <section className="card panel span-4">
            <div className="card-title">
              <h2>{x('academy.intervalTrainer')}</h2>
              <span className="badge">
                {earScore.correct}/{earScore.total}
              </span>
            </div>
            <p className="hint">{x('academy.intervalHelp')}</p>
            <button className="button button-primary button-wide" onClick={() => void newEarQuestion()}>
              <Icon name="music" />
              {x('academy.newInterval')}
            </button>
            <button className="button button-wide" onClick={() => void saveEarTraining()} disabled={!earScore.total}>
              <Icon name="save" />
              {x('academy.saveSession')}
            </button>
          </section>
          <section className="card panel span-8">
            <div className="interval-answer-grid">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((interval) => (
                <button
                  key={interval}
                  className="interval-answer"
                  disabled={!earQuestion}
                  onClick={() => answerEar(interval)}
                >
                  <strong>{interval}</strong>
                  <span>
                    {['Unison', 'm2', 'M2', 'm3', 'M3', 'P4', 'TT', 'P5', 'm6', 'M6', 'm7', 'M7', 'Octave'][interval]}
                  </span>
                </button>
              ))}
            </div>
          </section>
        </div>
      )}

      {tab === 'rhythm' && (
        <div className="academy-grid">
          <section className="card panel span-4">
            <div className="card-title">
              <h2>{x('academy.pulseTarget')}</h2>
              <span className="badge">{rhythmBpm} BPM</span>
            </div>
            <input
              aria-label={x('academy.pulseTarget')}
              type="range"
              min="30"
              max="220"
              value={rhythmBpm}
              onChange={(e) => setRhythmBpm(Number(e.target.value))}
            />
            <button className="button button-primary button-wide tap-button" onClick={tapBeat}>
              {x('academy.tapBeat')}
            </button>
            <div className="action-row">
              <button
                className="mini-button"
                onClick={() => {
                  setTaps([]);
                  rhythmStartedAt.current = 0;
                }}
              >
                {x('academy.resetTaps')}
              </button>
              <button
                className="mini-button"
                disabled={rhythmDeviation === null}
                onClick={() => void saveRhythmTraining()}
              >
                <Icon name="save" />
                {x('academy.saveSession')}
              </button>
            </div>
          </section>
          <section className="card panel span-8">
            <div className="metric-hero">
              <span>{x('academy.yourTapTempo')}</span>
              <strong>{tapTempo ? tapTempo.toFixed(1) : '—'} BPM</strong>
              <small>
                {rhythmDeviation !== null
                  ? `${rhythmDeviation.toFixed(1)} ${x('academy.fromTargetBpm')}`
                  : x('academy.tapTwice')}
              </small>
            </div>
            <div className="rhythm-track">
              <span style={{ width: `${rhythmDeviation === null ? 0 : Math.max(0, 100 - rhythmDeviation * 5)}%` }} />
            </div>
          </section>
        </div>
      )}

      {tab === 'sight' && (
        <div className="academy-grid">
          <section className="card panel span-4">
            <div className="card-title">
              <h2>{x('academy.sightTitle')}</h2>
              <span className="badge">{trainingDifficultyName(language, difficulty)}</span>
            </div>
            <p className="hint">{x('academy.sightBody')}</p>
            <div className="field">
              <label>{x('academy.referenceRoot')}</label>
              <select
                aria-label={x('academy.referenceRoot')}
                value={rootMidi}
                onChange={(e) => {
                  setRootMidi(Number(e.target.value));
                  setSightScore(createSightScore(Number(e.target.value), difficulty));
                }}
              >
                {Array.from({ length: 25 }, (_, i) => 48 + i).map((midi) => {
                  const n = midiToNote(midi);
                  return (
                    <option key={midi} value={midi}>
                      {n.note}
                      {n.octave}
                    </option>
                  );
                })}
              </select>
            </div>
            <div className="toolbar">
              <button className="button" onClick={newSightMelody}>
                <Icon name="spark" />
                {x('academy.newMelody')}
              </button>
              <button
                className="button"
                onClick={() => void player.current.play(makeSingleNote(rootMidi, 0.9), 0.2, 'reference')}
              >
                <Icon name="play" />
                {x('academy.hearTonic')}
              </button>
            </div>
            <button
              className={`button button-wide ${sightRunning ? 'button-danger' : 'button-primary'}`}
              onClick={() => void (sightRunning ? finishSight() : startSight())}
            >
              <Icon name={sightRunning ? 'stop' : 'mic'} />
              {sightRunning ? x('academy.finishSight') : x('academy.startSight')}
            </button>
            <div className="metric-row">
              <div>
                <span>{x('academy.currentTarget')}</span>
                <strong>{sightTarget}</strong>
              </div>
              <div>
                <span>{x('studio.currentNote')}</span>
                <strong>{audio.pitch ? `${audio.pitch.note}${audio.pitch.octave}` : '—'}</strong>
              </div>
            </div>
          </section>
          <section className="card score-preview-card span-8">
            <ScoreViewport svg={sightSvg} label={x('academy.sightTitle')} compact />
          </section>
        </div>
      )}

      {tab === 'guide' && (
        <div className="vocal-guide-grid">
          {vocalGuide.map((lesson) => (
            <article className="card panel vocal-guide-card" key={lesson.id}>
              <div className="card-title">
                <h2>{lesson.title}</h2>
                <span className="badge">{x('academy.guideBadge')}</span>
              </div>
              <p>{lesson.summary}</p>
              <ul>
                {lesson.principles.map((principle) => (
                  <li key={principle}>{principle}</li>
                ))}
              </ul>
              <div className="guide-practice">
                <strong>{x('academy.tryThis')}</strong>
                <p>{lesson.practice}</p>
              </div>
              {lesson.caution && (
                <div className="guide-caution">
                  <Icon name="shield" />
                  <span>{lesson.caution}</span>
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {tab === 'library' && (
        <>
          <div className="filter-row">
            <button
              className={`chip ${filterCategory === 'all' ? 'active' : ''}`}
              onClick={() => setFilterCategory('all')}
            >
              {x('academy.all')}
            </button>
            {CATEGORIES.map((category) => (
              <button
                key={category}
                className={`chip ${filterCategory === category ? 'active' : ''}`}
                onClick={() => setFilterCategory(category)}
              >
                {trainingCategoryName(language, category)}
              </button>
            ))}
          </div>
          <div className="exercise-library-grid">
            {filteredLibrary.map((exercise) => (
              <article className="card exercise-library-card" key={exercise.id}>
                <div className="card-title">
                  <h2>{exercise.name}</h2>
                  <span className="badge">{exercise.minutes} min</span>
                </div>
                <p>{exercise.description}</p>
                <div className="tag-list">
                  {exercise.focus.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
                <p className="hint">{exercise.instruction}</p>
                <div className="toolbar">
                  <span className="difficulty-pill">{trainingDifficultyName(language, exercise.difficulty)}</span>
                  {exercise.intervals?.length ? (
                    <button className="mini-button" onClick={() => void playExercise(exercise)}>
                      <Icon name="play" />
                      {x('academy.preview')}
                    </button>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      {message && (
        <div className="toast" role="status">
          {message}
        </div>
      )}
    </div>
  );
}
