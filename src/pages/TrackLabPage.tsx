import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../app/AppContext';
import { Icon } from '../components/Icon';
import { Seo } from '../components/Seo';
import { saveTrainingSession } from '../core/storage/database';
import { useAudioEngine } from '../hooks/useAudioEngine';
import { useI18n } from '../i18n/I18nContext';
import { proText } from '../i18n/proTranslations';

type Marker = { id: string; time: number; label: string };

function formatTime(value: number) {
  if (!Number.isFinite(value)) return '0:00';
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60)
    .toString()
    .padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function createPeaks(buffer: AudioBuffer, bins = 480) {
  const channels = Array.from({ length: buffer.numberOfChannels }, (_, index) => buffer.getChannelData(index));
  const block = Math.max(1, Math.floor(buffer.length / bins));
  return Array.from({ length: bins }, (_, bin) => {
    let peak = 0;
    const start = bin * block;
    const end = Math.min(buffer.length, start + block);
    for (let i = start; i < end; i += 1) {
      let sample = 0;
      for (const channel of channels) sample += Math.abs(channel[i] || 0);
      peak = Math.max(peak, sample / channels.length);
    }
    return Math.min(1, peak);
  });
}

export function TrackLabPage() {
  const { settings, project } = useApp();
  const { language } = useI18n();
  const x = (key: string) => proText(language, key);
  const audio = useAudioEngine(settings.referenceA4, settings.processingMode, settings.gateMultiplier);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrl = useRef<string | null>(null);
  const rehearsalStartedAt = useRef<number | null>(null);
  const [fileName, setFileName] = useState('');
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.85);
  const [speed, setSpeed] = useState(1);
  const [preservePitch, setPreservePitch] = useState(true);
  const [loopEnabled, setLoopEnabled] = useState(false);
  const [loopA, setLoopA] = useState(0);
  const [loopB, setLoopB] = useState(0);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [peaks, setPeaks] = useState<number[]>([]);
  const [message, setMessage] = useState('');

  const loopValid = loopB > loopA + 0.05;
  const progress = duration > 0 ? currentTime / duration : 0;
  const loopLeft = duration > 0 ? (loopA / duration) * 100 : 0;
  const loopWidth = duration > 0 && loopValid ? ((loopB - loopA) / duration) * 100 : 0;

  useEffect(() => {
    const element = audioRef.current;
    if (!element) return;
    element.volume = volume;
    element.playbackRate = speed;
    const pitchElement = element as HTMLAudioElement & { preservesPitch?: boolean; webkitPreservesPitch?: boolean };
    if ('preservesPitch' in pitchElement) pitchElement.preservesPitch = preservePitch;
    if ('webkitPreservesPitch' in pitchElement) pitchElement.webkitPreservesPitch = preservePitch;
  }, [volume, speed, preservePitch]);

  useEffect(() => {
    const element = audioRef.current;
    if (!element) return;
    const onTime = () => {
      if (loopEnabled && loopValid && element.currentTime >= loopB) element.currentTime = loopA;
      setCurrentTime(element.currentTime);
    };
    const onEnded = () => setPlaying(false);
    const onLoaded = () => {
      setDuration(element.duration || 0);
      setLoopB(element.duration || 0);
    };
    element.addEventListener('timeupdate', onTime);
    element.addEventListener('ended', onEnded);
    element.addEventListener('loadedmetadata', onLoaded);
    return () => {
      element.removeEventListener('timeupdate', onTime);
      element.removeEventListener('ended', onEnded);
      element.removeEventListener('loadedmetadata', onLoaded);
    };
  }, [loopEnabled, loopValid, loopA, loopB]);

  useEffect(
    () => () => {
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
      void audio.engine.stop();
    },
    [audio.engine]
  );

  const loadFile = async (file: File) => {
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    const url = URL.createObjectURL(file);
    objectUrl.current = url;
    setFileName(file.name);
    setMarkers([]);
    setCurrentTime(0);
    setPlaying(false);
    setMessage('');
    if (audioRef.current) {
      audioRef.current.src = url;
      audioRef.current.load();
    }
    try {
      const context = new AudioContext();
      const decoded = await context.decodeAudioData(await file.arrayBuffer());
      setDuration(decoded.duration);
      setLoopA(0);
      setLoopB(decoded.duration);
      setPeaks(createPeaks(decoded));
      await context.close();
    } catch {
      setPeaks([]);
      setMessage(x('track.waveformUnavailable'));
    }
  };

  const togglePlay = async () => {
    const element = audioRef.current;
    if (!element || !fileName) return;
    if (element.paused) {
      rehearsalStartedAt.current ??= Date.now();
      await element.play();
      setPlaying(true);
    } else {
      element.pause();
      setPlaying(false);
    }
  };

  const seek = (time: number) => {
    const element = audioRef.current;
    if (!element) return;
    element.currentTime = Math.max(0, Math.min(duration, time));
    setCurrentTime(element.currentTime);
  };

  const startMic = async () => {
    if (audio.state.active) {
      await audio.engine.stop();
      return;
    }
    try {
      await audio.engine.start({
        deviceId: settings.microphoneId || undefined,
        processingMode: settings.processingMode,
        referenceA4: settings.referenceA4,
        gateMultiplier: settings.gateMultiplier,
        noiseFloor: project.settings.noiseFloor,
        audioPreferences: settings.audio
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : x('status.micRequired'));
    }
  };

  const saveRehearsal = async () => {
    if (!rehearsalStartedAt.current) {
      setMessage(x('track.noSession'));
      return;
    }
    const completedAt = Date.now();
    await saveTrainingSession({
      id: crypto.randomUUID(),
      projectId: project.id,
      exerciseId: 'backing-track-rehearsal',
      exerciseName: fileName || x('track.rehearsal'),
      category: 'rhythm',
      difficulty: 'intermediate',
      startedAt: rehearsalStartedAt.current,
      completedAt,
      durationSeconds: Math.max(1, (completedAt - rehearsalStartedAt.current) / 1000)
    });
    rehearsalStartedAt.current = null;
    setMessage(x('track.sessionSaved'));
  };

  const addMarker = () => {
    const index = markers.length + 1;
    setMarkers((current) =>
      [...current, { id: crypto.randomUUID(), time: currentTime, label: `${x('track.marker')} ${index}` }].sort(
        (a, b) => a.time - b.time
      )
    );
  };

  const waveformBars = useMemo(
    () =>
      peaks.map((peak, index) => ({
        x: (index / Math.max(1, peaks.length)) * 100,
        height: Math.max(2, peak * 88)
      })),
    [peaks]
  );

  return (
    <div className="page">
      <Seo title={x('track.title')} description={x('track.body')} path="/track-lab" />
      <audio ref={audioRef} preload="metadata" />
      <div className="page-header">
        <div className="page-title-wrap">
          <div className="eyebrow">{x('track.eyebrow')}</div>
          <h1>{x('track.title')}</h1>
          <p>{x('track.body')}</p>
        </div>
        <label className="button button-primary file-button">
          <Icon name="upload" />
          {x('track.load')}
          <input
            type="file"
            accept="audio/*"
            onChange={(event) => event.target.files?.[0] && void loadFile(event.target.files[0])}
          />
        </label>
      </div>

      <div className="track-lab-grid">
        <section className="card panel span-12 track-wave-card">
          <div className="card-title">
            <h2>{fileName || x('track.noFile')}</h2>
            <span className="badge">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
          <button
            className="track-waveform"
            aria-label={x('track.seek')}
            disabled={!duration}
            onClick={(event) => {
              const rect = event.currentTarget.getBoundingClientRect();
              seek(((event.clientX - rect.left) / rect.width) * duration);
            }}
          >
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              {waveformBars.map((bar, index) => (
                <rect
                  key={index}
                  x={bar.x}
                  y={(100 - bar.height) / 2}
                  width={Math.max(0.08, (100 / Math.max(1, waveformBars.length)) * 0.72)}
                  height={bar.height}
                  rx=".08"
                />
              ))}
            </svg>
            {loopValid && (
              <span
                className={`loop-region ${loopEnabled ? 'active' : ''}`}
                style={{ left: `${loopLeft}%`, width: `${loopWidth}%` }}
              />
            )}
            <span className="track-playhead" style={{ left: `${progress * 100}%` }} />
            {markers.map((marker) => (
              <span
                key={marker.id}
                className="track-marker-pin"
                style={{ left: `${duration ? (marker.time / duration) * 100 : 0}%` }}
              />
            ))}
          </button>
          <input
            aria-label={x('track.seek')}
            type="range"
            min="0"
            max={Math.max(duration, 0.01)}
            step="0.01"
            value={Math.min(currentTime, duration || 0)}
            onChange={(event) => seek(Number(event.target.value))}
            disabled={!duration}
          />
          <div className="track-transport">
            <button
              className="icon-button"
              onClick={() => seek(currentTime - 5)}
              disabled={!fileName}
              aria-label={x('track.back5')}
            >
              −5
            </button>
            <button className="button button-primary" onClick={() => void togglePlay()} disabled={!fileName}>
              <Icon name={playing ? 'stop' : 'play'} />
              {playing ? x('track.pause') : x('track.play')}
            </button>
            <button
              className="icon-button"
              onClick={() => seek(currentTime + 5)}
              disabled={!fileName}
              aria-label={x('track.forward5')}
            >
              +5
            </button>
            <button className={`button ${audio.state.active ? 'button-danger' : ''}`} onClick={() => void startMic()}>
              <Icon name={audio.state.active ? 'stop' : 'mic'} />
              {audio.state.active ? x('track.stopMic') : x('track.startMic')}
            </button>
          </div>
        </section>

        <section className="card panel span-4">
          <div className="card-title">
            <h2>{x('track.playback')}</h2>
            <span className="badge">{speed.toFixed(2)}×</span>
          </div>
          <div className="field">
            <label>{x('track.speed')}</label>
            <input
              aria-label={x('track.speed')}
              type="range"
              min="0.5"
              max="1.5"
              step="0.05"
              value={speed}
              onChange={(event) => setSpeed(Number(event.target.value))}
            />
          </div>
          <div className="field">
            <label>{x('track.volume')}</label>
            <input
              aria-label={x('track.volume')}
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(event) => setVolume(Number(event.target.value))}
            />
          </div>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={preservePitch}
              onChange={(event) => setPreservePitch(event.target.checked)}
            />
            {x('track.preservePitch')}
          </label>
          <p className="hint">{x('track.preservePitchHelp')}</p>
        </section>

        <section className="card panel span-4">
          <div className="card-title">
            <h2>{x('track.loop')}</h2>
            <span className={`badge ${loopEnabled && loopValid ? '' : 'off'}`}>
              {loopEnabled && loopValid ? 'A–B' : 'Off'}
            </span>
          </div>
          <div className="metric-row">
            <div>
              <span>A</span>
              <strong>{formatTime(loopA)}</strong>
            </div>
            <div>
              <span>B</span>
              <strong>{formatTime(loopB)}</strong>
            </div>
          </div>
          <div className="action-row">
            <button className="mini-button" onClick={() => setLoopA(currentTime)} disabled={!fileName}>
              {x('track.setA')}
            </button>
            <button className="mini-button" onClick={() => setLoopB(currentTime)} disabled={!fileName}>
              {x('track.setB')}
            </button>
          </div>
          <button
            className={`button button-wide ${loopEnabled ? 'button-primary' : ''}`}
            disabled={!loopValid}
            onClick={() => setLoopEnabled((value) => !value)}
          >
            {loopEnabled ? x('track.disableLoop') : x('track.enableLoop')}
          </button>
        </section>

        <section className="card panel span-4">
          <div className="card-title">
            <h2>{x('track.liveVoice')}</h2>
            <span className="badge">{audio.state.active ? x('track.listening') : 'Offline'}</span>
          </div>
          <div className="track-live-note">
            <strong>{audio.pitch ? `${audio.pitch.note}${audio.pitch.octave}` : '—'}</strong>
            <span>
              {audio.pitch
                ? `${audio.pitch.frequency.toFixed(2)} Hz · ${audio.pitch.cents > 0 ? '+' : ''}${audio.pitch.cents}¢`
                : x('track.startMicHelp')}
            </span>
          </div>
          <button className="button button-wide" onClick={() => void saveRehearsal()}>
            <Icon name="save" />
            {x('track.saveSession')}
          </button>
        </section>

        <section className="card panel span-12">
          <div className="card-title">
            <h2>{x('track.markers')}</h2>
            <button className="mini-button" disabled={!fileName} onClick={addMarker}>
              <Icon name="plus" />
              {x('track.addMarker')}
            </button>
          </div>
          {markers.length ? (
            <div className="track-marker-list">
              {markers.map((marker) => (
                <div className="track-marker-row" key={marker.id}>
                  <button onClick={() => seek(marker.time)}>
                    <strong>{marker.label}</strong>
                    <span>{formatTime(marker.time)}</span>
                  </button>
                  <button
                    className="icon-button"
                    onClick={() => setMarkers((current) => current.filter((item) => item.id !== marker.id))}
                    aria-label={x('progress.remove')}
                  >
                    <Icon name="trash" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-state">{x('track.noMarkers')}</p>
          )}
        </section>
      </div>
      {message && (
        <div className="toast" role="status">
          {message}
        </div>
      )}
    </div>
  );
}
