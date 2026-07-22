import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../app/AppContext';
import { Icon } from '../components/Icon';
import { PitchHistory } from '../components/PitchHistory';
import { PitchOrb } from '../components/PitchOrb';
import { Seo } from '../components/Seo';
import { deleteRecording, listRecordings, saveRecording } from '../core/storage/database';
import { saveBlobToDevice } from '../core/storage/projectFile';
import { useAudioEngine } from '../hooks/useAudioEngine';
import { useI18n } from '../i18n/I18nContext';
import { SpeechEngine } from '../core/speech/speechEngine';
import type { PitchFrame, ProcessingMode, RecordingEntry } from '../types';

function RecordingCard({ recording, onDelete }: { recording: RecordingEntry; onDelete: (id: string) => void }) {
  const { t } = useI18n();
  const source = useMemo(() => URL.createObjectURL(recording.blob), [recording.blob]);
  useEffect(() => () => URL.revokeObjectURL(source), [source]);
  return (
    <article className="recording-card">
      <div className="recording-main">
        <strong>{recording.name}</strong>
        <span>
          {new Date(recording.createdAt).toLocaleString()} · {recording.duration.toFixed(1)}s
        </span>
      </div>
      <audio controls preload="metadata" src={source} />
      <div className="recording-actions">
        <button
          className="button"
          onClick={() => void saveBlobToDevice(recording.blob, recording.name, recording.mimeType)}
        >
          <Icon name="download" />
          {t('common.saveDevice')}
        </button>
        <button className="button button-danger" onClick={() => onDelete(recording.id)}>
          <Icon name="trash" />
          {t('common.delete')}
        </button>
      </div>
    </article>
  );
}

export function StudioPage() {
  const { t, language } = useI18n();
  const { settings, setSettings, project, setProject } = useApp();
  const audio = useAudioEngine(settings.referenceA4, settings.processingMode, settings.gateMultiplier);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [frames, setFrames] = useState<PitchFrame[]>([]);
  const [calibrating, setCalibrating] = useState(false);
  const [toast, setToast] = useState('');
  const speech = useRef(new SpeechEngine());
  const [voiceCommands, setVoiceCommands] = useState(false);
  const [voiceText, setVoiceText] = useState('');
  const [voiceLevel, setVoiceLevel] = useState<number | null>(null);
  const [recordings, setRecordings] = useState<RecordingEntry[]>([]);
  const [lastRecording, setLastRecording] = useState<{
    blob: Blob;
    mimeType: string;
    duration: number;
    name: string;
  } | null>(null);

  useEffect(
    () =>
      audio.subscribePitch((frame) => {
        setFrames((current) => [...current.slice(-399), frame]);
        setProject((current) => ({
          ...current,
          pitchHistory: [...current.pitchHistory.slice(-999), frame],
          updatedAt: Date.now()
        }));
      }),
    [audio, setProject]
  );

  useEffect(() => {
    void listRecordings(project.id)
      .then(setRecordings)
      .catch(() => setRecordings([]));
  }, [project.id]);

  useEffect(() => () => speech.current.stopCommands(), []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 2200);
    return () => clearTimeout(timer);
  }, [toast]);

  const start = async () => {
    try {
      await audio.engine.start({
        deviceId: settings.microphoneId || undefined,
        processingMode: settings.processingMode,
        referenceA4: settings.referenceA4,
        gateMultiplier: settings.gateMultiplier,
        noiseFloor: project.settings.noiseFloor,
        audioPreferences: settings.audio
      });
      setDevices(await audio.engine.listInputDevices());
    } catch (error) {
      audio.setError(error instanceof Error ? error.message : t('status.micRequired'));
    }
  };

  const calibrate = async () => {
    setCalibrating(true);
    setToast(t('status.calibrating'));
    try {
      const floor = await audio.engine.calibrateSilence(3000);
      setProject((current) => ({
        ...current,
        settings: { ...current.settings, noiseFloor: floor },
        updatedAt: Date.now()
      }));
      setToast(t('calibration.done'));
    } catch (error) {
      audio.setError(error instanceof Error ? error.message : 'Calibration failed.');
    } finally {
      setCalibrating(false);
    }
  };

  const toggleRecording = async () => {
    try {
      if (!audio.state.recording) {
        audio.engine.startRecording();
        return;
      }
      const result = await audio.engine.stopRecording();
      const name = `OpenVox_${new Date().toISOString().replace(/[:.]/g, '-')}.${result.mimeType.includes('mp4') ? 'm4a' : 'webm'}`;
      await saveRecording({
        id: crypto.randomUUID(),
        projectId: project.id,
        name,
        blob: result.blob,
        mimeType: result.mimeType,
        duration: result.duration,
        createdAt: Date.now()
      });
      setRecordings(await listRecordings(project.id));
      setLastRecording({ ...result, name });
      setToast(t('status.recordingSaved'));
    } catch (error) {
      audio.setError(error instanceof Error ? error.message : 'Recording failed.');
    }
  };

  const measureVoiceLevel = async () => {
    setToast(t('studio.singCalibration'));
    try {
      const level = await audio.engine.measureAverageLevel(3000);
      setVoiceLevel(level);
      setToast(level < 0.008 ? t('studio.inputQuiet') : level > 0.22 ? t('studio.inputLoud') : t('studio.inputGood'));
    } catch (error) {
      audio.setError(error instanceof Error ? error.message : 'Input calibration failed.');
    }
  };

  const removeRecording = async (id: string) => {
    await deleteRecording(id);
    setRecordings(await listRecordings(project.id));
  };

  const changeMode = (mode: ProcessingMode) => setSettings((current) => ({ ...current, processingMode: mode }));

  const toggleVoiceCommands = () => {
    if (voiceCommands) {
      speech.current.stopCommands();
      setVoiceCommands(false);
      return;
    }
    try {
      const locale = language === 'uk' ? 'uk-UA' : language === 'de' ? 'de-DE' : 'en-US';
      speech.current.startCommands(
        locale,
        {
          start: () => void start(),
          stop: () => void audio.engine.stop(),
          record: () => void toggleRecording(),
          save: () => {
            if (lastRecording) void saveBlobToDevice(lastRecording.blob, lastRecording.name, lastRecording.mimeType);
          },
          calibrate: () => void calibrate()
        },
        setVoiceText
      );
      setVoiceCommands(true);
      setToast(t('studio.voiceEnabled'));
    } catch (error) {
      audio.setError(error instanceof Error ? error.message : 'Voice commands are unavailable.');
    }
  };

  return (
    <div className="page">
      <Seo title={t('studio.title')} description={t('studio.subtitle')} path="/studio" />
      <div className="page-header">
        <div className="page-title-wrap">
          <div className="eyebrow">OpenVox Core</div>
          <h1>{t('studio.title')}</h1>
          <p>{t('studio.subtitle')}</p>
        </div>
      </div>
      <div className="studio-grid">
        <aside className="card control-card">
          <div className="card-title">
            <h2>{t('studio.mic')}</h2>
            <span className={`badge ${audio.state.active ? '' : 'off'}`}>
              {audio.state.active ? t('common.ready') : 'Offline'}
            </span>
          </div>
          <div className="field">
            <label>{t('studio.mic')}</label>
            <select
              aria-label={t('studio.mic')}
              value={settings.microphoneId}
              onChange={(e) => setSettings((current) => ({ ...current, microphoneId: e.target.value }))}
            >
              {devices.length ? (
                devices.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `Microphone ${device.deviceId.slice(0, 6)}`}
                  </option>
                ))
              ) : (
                <option value="">{t('studio.defaultMic')}</option>
              )}
            </select>
          </div>
          <div className="field">
            <label>{t('studio.mode')}</label>
            <div className="segmented">
              {(['raw', 'vocal', 'noisy', 'custom'] as ProcessingMode[]).map((mode) => (
                <button
                  key={mode}
                  className={settings.processingMode === mode ? 'active' : ''}
                  onClick={() => changeMode(mode)}
                >
                  {t(`studio.${mode}`)}
                </button>
              ))}
            </div>
          </div>
          <div className="field">
            <label>Noise gate · {settings.gateMultiplier.toFixed(1)}×</label>
            <input
              aria-label={`Noise gate ${settings.gateMultiplier.toFixed(1)}×`}
              type="range"
              min="1"
              max="4"
              step="0.1"
              value={settings.gateMultiplier}
              onChange={(e) => setSettings((current) => ({ ...current, gateMultiplier: Number(e.target.value) }))}
            />
          </div>
          <div className="action-row">
            {!audio.state.active ? (
              <button className="button button-primary" onClick={start}>
                <Icon name="mic" />
                {t('common.start')}
              </button>
            ) : (
              <button className="button" onClick={() => void audio.engine.stop()}>
                <Icon name="stop" />
                {t('common.stop')}
              </button>
            )}
            <button
              className={`button ${audio.state.recording ? 'button-danger' : ''}`}
              disabled={!audio.state.active}
              onClick={toggleRecording}
            >
              <Icon name={audio.state.recording ? 'stop' : 'record'} />
              {audio.state.recording ? t('common.stopRecord') : t('common.record')}
            </button>
          </div>
          {lastRecording && (
            <button
              className="button button-secondary button-wide"
              onClick={() => void saveBlobToDevice(lastRecording.blob, lastRecording.name, lastRecording.mimeType)}
            >
              <Icon name="download" />
              {t('studio.saveRecordingDevice')}
            </button>
          )}
          {audio.error && (
            <p className="hint" style={{ color: 'var(--red)' }}>
              {audio.error}
            </p>
          )}
          <section className="card calibration-card">
            <div className="card-title">
              <h3>{t('studio.voiceControl')}</h3>
              <span className={`badge ${voiceCommands ? '' : 'off'}`}>
                {voiceCommands ? t('common.on') : t('common.off')}
              </span>
            </div>
            <p>{t('studio.voiceControlBody')}</p>
            <button className="button button-wide" onClick={toggleVoiceCommands}>
              <Icon name="mic" />
              {voiceCommands ? t('studio.disableVoice') : t('studio.enableVoice')}
            </button>
            {voiceText && (
              <p className="hint">
                {t('studio.heard')}: {voiceText}
              </p>
            )}
          </section>
          <section className="card calibration-card">
            <div className="card-title">
              <h3>{t('calibration.title')}</h3>
              <span className="noise-value">{audio.state.noiseFloor.toFixed(4)}</span>
            </div>
            <p>{t('calibration.body')}</p>
            <div className="calibration-steps">
              <div>
                <span className="stat-label">{t('studio.stepEnvironment')}</span>
                <button
                  className="button button-wide"
                  disabled={!audio.state.active || calibrating}
                  onClick={calibrate}
                >
                  <Icon name="wave" />
                  {calibrating ? t('status.calibrating') : t('calibration.run')}
                </button>
              </div>
              <div>
                <span className="stat-label">{t('studio.stepVoice')}</span>
                <button
                  className="button button-wide"
                  disabled={!audio.state.active || calibrating}
                  onClick={() => void measureVoiceLevel()}
                >
                  <Icon name="mic" />
                  {t('studio.measureVoice')}
                </button>
                {voiceLevel !== null && (
                  <span className="hint">
                    {t('studio.averageRms')} · {voiceLevel.toFixed(4)}
                  </span>
                )}
              </div>
            </div>
          </section>
        </aside>
        <section className="studio-center">
          <div className="card live-card">
            <PitchOrb pitch={audio.pitch} level={audio.level} active={audio.state.active} />
            <div className="metrics-grid">
              <div className="metric">
                <span>{t('studio.frequency')}</span>
                <strong>{audio.pitch ? `${audio.pitch.frequency.toFixed(2)} Hz` : '—'}</strong>
              </div>
              <div className="metric">
                <span>{t('studio.cents')}</span>
                <strong>{audio.pitch ? `${audio.pitch.cents > 0 ? '+' : ''}${audio.pitch.cents}` : '—'}</strong>
              </div>
              <div className="metric">
                <span>{t('studio.confidence')}</span>
                <strong>{audio.pitch ? `${Math.round(audio.pitch.confidence * 100)}%` : '—'}</strong>
              </div>
              <div className="metric">
                <span>{t('studio.level')}</span>
                <strong>{Math.round(Math.min(1, audio.level * 8) * 100)}%</strong>
              </div>
            </div>
          </div>
          <div className="card history-card">
            <div className="card-title">
              <h2>{t('studio.history')}</h2>
              <span className="badge">{frames.length} frames</span>
            </div>
            <PitchHistory frames={frames} />
          </div>
        </section>
        <aside className="card control-card">
          <div className="card-title">
            <h2>{t('studio.harmony')}</h2>
            <span className="badge">{t('common.experimental')}</span>
          </div>
          {audio.harmony.length ? (
            <div className="harmony-list">
              {audio.harmony.map((pitch) => (
                <div className="harmony-row" key={`${pitch.note}-${pitch.frequency.toFixed(1)}`}>
                  <strong>{pitch.note}</strong>
                  <div className="harmony-bar">
                    <span style={{ width: `${Math.round(pitch.strength * 100)}%` }} />
                  </div>
                  <span className="hint">{pitch.frequency.toFixed(0)} Hz</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">{t('studio.noHarmony')}</div>
          )}
        </aside>
      </div>
      <section className="card recording-library">
        <div className="card-title">
          <h2>{t('studio.recordings')}</h2>
          <span className="badge">{recordings.length}</span>
        </div>
        {recordings.length ? (
          <div className="recording-list">
            {recordings.map((recording) => (
              <RecordingCard key={recording.id} recording={recording} onDelete={(id) => void removeRecording(id)} />
            ))}
          </div>
        ) : (
          <div className="empty-state">{t('studio.noRecordings')}</div>
        )}
      </section>
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
