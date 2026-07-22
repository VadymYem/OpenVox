import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../app/AppContext';
import { Icon } from '../components/Icon';
import { PitchHistory } from '../components/PitchHistory';
import { Seo } from '../components/Seo';
import { estimateTempo, quantizeNotes, transcribePitchFrames } from '../core/music/transcriber';
import { analyzeAudioFile } from '../core/audio/audioFileAnalyzer';
import { useAudioEngine } from '../hooks/useAudioEngine';
import { useI18n } from '../i18n/I18nContext';
import type { MusicalNoteEvent, PitchFrame, QuantizeMode } from '../types';

const QUANTIZE_MODES: Array<{ value: QuantizeMode; label: string }> = [
  { value: 'free', label: 'Free' },
  { value: 4, label: '1/4' },
  { value: 8, label: '1/8' },
  { value: '8t', label: '1/8T' },
  { value: 16, label: '1/16' }
];

export function TranscribePage() {
  const { t } = useI18n();
  const { settings, project, setProject } = useApp();
  const audio = useAudioEngine(settings.referenceA4, settings.processingMode, settings.gateMultiplier);
  const [capturing, setCapturing] = useState(false);
  const [frames, setFrames] = useState<PitchFrame[]>([]);
  const framesRef = useRef<PitchFrame[]>([]);
  const [rawNotes, setRawNotes] = useState<MusicalNoteEvent[]>([]);
  const [notes, setNotes] = useState<MusicalNoteEvent[]>([]);
  const [tempo, setTempo] = useState(90);
  const [division, setDivision] = useState<QuantizeMode>(8);
  const [fileProgress, setFileProgress] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(
    () =>
      audio.subscribePitch((frame) => {
        if (!capturing) return;
        framesRef.current = [...framesRef.current, frame];
        setFrames(framesRef.current);
      }),
    [audio, capturing]
  );

  useEffect(() => {
    if (!capturing) return;
    const timer = window.setInterval(() => {
      const detected = transcribePitchFrames(framesRef.current);
      const bpm = detected.length >= 3 ? estimateTempo(detected) : tempo;
      setRawNotes(detected);
      if (detected.length >= 3) setTempo(bpm);
      setNotes(quantizeNotes(detected, bpm, division));
    }, 420);
    return () => window.clearInterval(timer);
  }, [capturing, division, tempo]);

  const begin = async () => {
    framesRef.current = [];
    setFrames([]);
    setRawNotes([]);
    setNotes([]);
    setMessage('');
    if (!audio.state.active)
      await audio.engine.start({
        deviceId: settings.microphoneId || undefined,
        processingMode: settings.processingMode,
        referenceA4: settings.referenceA4,
        gateMultiplier: settings.gateMultiplier,
        noiseFloor: project.settings.noiseFloor,
        audioPreferences: settings.audio
      });
    setCapturing(true);
  };

  const finish = () => {
    setCapturing(false);
    const detected = transcribePitchFrames(framesRef.current);
    const bpm = detected.length >= 3 ? estimateTempo(detected) : tempo;
    setRawNotes(detected);
    setTempo(bpm);
    setNotes(quantizeNotes(detected, bpm, division));
  };

  const requantize = (nextDivision: QuantizeMode) => {
    setDivision(nextDivision);
    setNotes(quantizeNotes(rawNotes, tempo, nextDivision));
  };

  const changeTempo = (nextTempo: number) => {
    const safe = Math.max(30, Math.min(240, nextTempo || 90));
    setTempo(safe);
    setNotes(quantizeNotes(rawNotes, safe, division));
  };

  const importAudio = async (file: File) => {
    setMessage('');
    framesRef.current = [];
    setFrames([]);
    setRawNotes([]);
    setNotes([]);
    setFileProgress(0);
    try {
      const analyzed = await analyzeAudioFile(file, { referenceA4: settings.referenceA4, onProgress: setFileProgress });
      const detected = transcribePitchFrames(analyzed);
      const bpm = detected.length >= 3 ? estimateTempo(detected) : 90;
      framesRef.current = analyzed;
      setFrames(analyzed);
      setRawNotes(detected);
      setTempo(bpm);
      setNotes(quantizeNotes(detected, bpm, division));
      setMessage(`${t('transcribe.analyzed')} ${file.name} · ${detected.length} ${t('common.notes')}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t('transcribe.analysisFailed'));
    } finally {
      setFileProgress(null);
    }
  };

  const openInEditor = () => {
    const now = Date.now();
    setProject({
      ...project,
      updatedAt: now,
      score: { ...project.score, notes, tempo, updatedAt: now, title: project.score.title || 'Voice transcription' }
    });
    navigate('/score');
  };

  return (
    <div className="page">
      <Seo title={t('transcribe.title')} description={t('transcribe.subtitle')} path="/transcribe" />
      <div className="page-header">
        <div className="page-title-wrap">
          <div className="eyebrow">OpenVox Transcription</div>
          <h1>{t('transcribe.title')}</h1>
          <p>{t('transcribe.subtitle')}</p>
        </div>
      </div>
      <div className="transcribe-grid">
        <section className="card panel span-4">
          <div className="card-title">
            <h2>{t('transcribe.capture')}</h2>
            <span className={`badge ${capturing ? '' : 'off'}`}>
              {capturing ? t('common.listening') : t('common.idle')}
            </span>
          </div>
          <div className="action-row">
            {!capturing ? (
              <button className="button button-primary" onClick={() => void begin()}>
                <Icon name="record" />
                {t('transcribe.capture')}
              </button>
            ) : (
              <button className="button button-danger" onClick={finish}>
                <Icon name="stop" />
                {t('transcribe.finish')}
              </button>
            )}
            <button
              className="button"
              onClick={() => {
                framesRef.current = [];
                setFrames([]);
                setRawNotes([]);
                setNotes([]);
              }}
            >
              <Icon name="trash" />
              {t('transcribe.clear')}
            </button>
            <label className="button file-button">
              <Icon name="upload" />
              {t('transcribe.importAudio')}
              <input
                type="file"
                accept="audio/*,.wav,.mp3,.m4a,.aac,.ogg,.webm,.flac"
                onChange={(e) => e.target.files?.[0] && void importAudio(e.target.files[0])}
              />
            </label>
          </div>
          {fileProgress !== null && (
            <div className="analysis-progress">
              <span style={{ width: `${Math.round(fileProgress * 100)}%` }} />
            </div>
          )}
          {message && <p className="hint">{message}</p>}
          <div className="field">
            <label>{t('transcribe.quantize')}</label>
            <div className="segmented quantize-segmented">
              {QUANTIZE_MODES.map(({ value, label }) => (
                <button
                  key={String(value)}
                  className={division === value ? 'active' : ''}
                  onClick={() => requantize(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="field" style={{ marginTop: 22 }}>
            <label>{t('transcribe.tempo')} · BPM</label>
            <input
              aria-label={t('transcribe.tempo')}
              type="number"
              min="30"
              max="240"
              value={tempo}
              onChange={(e) => changeTempo(Number(e.target.value))}
            />
          </div>
          <div>
            <span className="stat-label">{t('transcribe.tempo')}</span>
            <div className="stat-large">{tempo}</div>
            <span className="hint">BPM</span>
          </div>
        </section>
        <section className="card panel span-8">
          <div className="card-title">
            <h2>{t('studio.history')}</h2>
            <span className="badge">
              {frames.length} {t('common.frames')}
            </span>
          </div>
          <PitchHistory frames={frames} />
        </section>
        <section className="card panel span-12">
          <div className="card-title">
            <h2>{t('transcribe.detected')}</h2>
            <span className="badge">
              {notes.length} {t('common.notes')}
            </span>
          </div>
          {notes.length ? (
            <>
              <div className="note-chip-list">
                {notes.map((note) => (
                  <span className="note-chip" key={note.id}>
                    {note.note}
                    {note.octave} · {note.duration.toFixed(2)}s
                  </span>
                ))}
              </div>
              <div className="action-row">
                <button className="button button-primary" onClick={openInEditor}>
                  <Icon name="score" />
                  {t('transcribe.sendScore')}
                </button>
              </div>
            </>
          ) : (
            <div className="empty-state">{t('transcribe.empty')}</div>
          )}
        </section>
      </div>
    </div>
  );
}
