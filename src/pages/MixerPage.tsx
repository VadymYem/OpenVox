import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../app/AppContext';
import { Icon } from '../components/Icon';
import { Seo } from '../components/Seo';
import { audioBufferToWav } from '../core/audio/wav';
import { downloadBlob } from '../core/export/scoreExport';
import { useI18n } from '../i18n/I18nContext';
import { proText } from '../i18n/proTranslations';

type MixerTrack = {
  id: string;
  name: string;
  buffer: AudioBuffer;
  offset: number;
  gain: number;
  pan: number;
  muted: boolean;
  solo: boolean;
  peaks: number[];
};

type LiveNodes = { gain: GainNode; panner?: StereoPannerNode };

function formatTime(value: number) {
  const safe = Number.isFinite(value) ? Math.max(0, value) : 0;
  return `${Math.floor(safe / 60)}:${Math.floor(safe % 60)
    .toString()
    .padStart(2, '0')}.${Math.floor((safe % 1) * 10)}`;
}

function makePeaks(buffer: AudioBuffer, bins = 180) {
  const channel = buffer.getChannelData(0);
  const size = Math.max(1, Math.floor(channel.length / bins));
  return Array.from({ length: bins }, (_, index) => {
    let peak = 0;
    const start = index * size;
    const end = Math.min(channel.length, start + size);
    for (let i = start; i < end; i += 1) peak = Math.max(peak, Math.abs(channel[i] || 0));
    return peak;
  });
}

export function MixerPage() {
  const { settings } = useApp();
  const { language } = useI18n();
  const x = (key: string) => proText(language, key);
  const [tracks, setTracks] = useState<MixerTrack[]>([]);
  const [position, setPosition] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [masterGain, setMasterGain] = useState(0.85);
  const [loopEnabled, setLoopEnabled] = useState(false);
  const [loopA, setLoopA] = useState(0);
  const [loopB, setLoopB] = useState(0);
  const [recording, setRecording] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState('');
  const contextRef = useRef<AudioContext | null>(null);
  const sourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const nodesRef = useRef(new Map<string, LiveNodes>());
  const masterNodeRef = useRef<GainNode | null>(null);
  const playStartContext = useRef(0);
  const playStartPosition = useRef(0);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const recordingStream = useRef<MediaStream | null>(null);
  const recordingChunks = useRef<Blob[]>([]);
  const recordingOffset = useRef(0);

  const duration = useMemo(
    () => tracks.reduce((max, track) => Math.max(max, track.offset + track.buffer.duration), 0),
    [tracks]
  );
  const anySolo = tracks.some((track) => track.solo);
  const loopValid = loopB > loopA + 0.05;

  useEffect(() => {
    if (!duration) return;
    setLoopB((current) => (current > 0 ? Math.min(current, duration) : duration));
  }, [duration]);

  const getContext = useCallback(() => {
    if (!contextRef.current) {
      const AudioContextConstructor =
        window.AudioContext ||
        (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextConstructor) throw new Error(x('mixer.webAudioUnavailable'));
      contextRef.current = new AudioContextConstructor({
        latencyHint: settings.audio.latencyHint,
        sampleRate: settings.audio.requestedSampleRate || undefined
      });
    }
    return contextRef.current;
  }, [settings.audio.latencyHint, settings.audio.requestedSampleRate, x]);

  const stopSources = useCallback(() => {
    for (const source of sourcesRef.current) {
      try {
        source.stop();
      } catch {
        /* already stopped */
      }
    }
    sourcesRef.current = [];
    nodesRef.current.clear();
    try {
      masterNodeRef.current?.disconnect();
    } catch {
      /* already disconnected */
    }
    masterNodeRef.current = null;
  }, []);

  const stopPlayback = useCallback(
    (rememberPosition = true) => {
      const context = contextRef.current;
      if (rememberPosition && playing && context)
        setPosition(Math.min(duration, playStartPosition.current + (context.currentTime - playStartContext.current)));
      stopSources();
      setPlaying(false);
    },
    [duration, playing, stopSources]
  );

  const startPlayback = useCallback(
    async (from = position) => {
      if (!tracks.length) return;
      const context = getContext();
      await context.resume();
      stopSources();
      const master = context.createGain();
      master.gain.value = masterGain;
      master.connect(context.destination);
      masterNodeRef.current = master;
      const soloMode = tracks.some((track) => track.solo);
      const startAt = Math.max(0, Math.min(duration, from));

      for (const track of tracks) {
        const sourceOffset = Math.max(0, startAt - track.offset);
        if (sourceOffset >= track.buffer.duration) continue;
        const delay = Math.max(0, track.offset - startAt);
        const source = context.createBufferSource();
        source.buffer = track.buffer;
        const gain = context.createGain();
        const audible = !track.muted && (!soloMode || track.solo);
        gain.gain.value = audible ? track.gain : 0;
        source.connect(gain);
        let panner: StereoPannerNode | undefined;
        if (typeof context.createStereoPanner === 'function') {
          panner = context.createStereoPanner();
          panner.pan.value = track.pan;
          gain.connect(panner);
          panner.connect(master);
        } else gain.connect(master);
        source.start(context.currentTime + delay, sourceOffset);
        sourcesRef.current.push(source);
        nodesRef.current.set(track.id, { gain, panner });
      }
      playStartContext.current = context.currentTime;
      playStartPosition.current = startAt;
      setPosition(startAt);
      setPlaying(true);
    },
    [duration, getContext, masterGain, position, stopSources, tracks]
  );

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      const context = contextRef.current;
      if (!context) return;
      const next = playStartPosition.current + (context.currentTime - playStartContext.current);
      if (loopEnabled && loopValid && next >= loopB) {
        void startPlayback(loopA);
        return;
      }
      if (next >= duration) {
        stopPlayback(false);
        setPosition(duration);
        return;
      }
      setPosition(next);
    }, 50);
    return () => window.clearInterval(timer);
  }, [duration, loopA, loopB, loopEnabled, loopValid, playing, startPlayback, stopPlayback]);

  useEffect(() => {
    const node = masterNodeRef.current;
    const context = contextRef.current;
    if (node && context) node.gain.setTargetAtTime(masterGain, context.currentTime, 0.015);
  }, [masterGain]);

  useEffect(() => {
    const soloMode = tracks.some((track) => track.solo);
    for (const track of tracks) {
      const nodes = nodesRef.current.get(track.id);
      if (!nodes) continue;
      const audible = !track.muted && (!soloMode || track.solo);
      nodes.gain.gain.setTargetAtTime(audible ? track.gain : 0, contextRef.current?.currentTime || 0, 0.01);
      nodes.panner?.pan.setTargetAtTime(track.pan, contextRef.current?.currentTime || 0, 0.01);
    }
  }, [tracks]);

  useEffect(
    () => () => {
      stopSources();
      recordingStream.current?.getTracks().forEach((track) => track.stop());
      void contextRef.current?.close();
    },
    [stopSources]
  );

  const decodeFile = async (file: File | Blob, name: string, offset = 0) => {
    const context = getContext();
    const buffer = await context.decodeAudioData(await file.arrayBuffer());
    setTracks((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        name,
        buffer,
        offset,
        gain: 0.9,
        pan: 0,
        muted: false,
        solo: false,
        peaks: makePeaks(buffer)
      }
    ]);
  };

  const importFiles = async (files: FileList | File[]) => {
    setMessage('');
    for (const file of Array.from(files)) {
      try {
        await decodeFile(file, file.name);
      } catch {
        setMessage(`${x('mixer.decodeFailed')}: ${file.name}`);
      }
    }
  };

  const updateTrack = (id: string, patch: Partial<MixerTrack>) =>
    setTracks((current) => current.map((track) => (track.id === id ? { ...track, ...patch } : track)));

  const seek = async (value: number) => {
    const next = Math.max(0, Math.min(duration, value));
    setPosition(next);
    if (playing) await startPlayback(next);
  };

  const startRecording = async () => {
    try {
      if (!('MediaRecorder' in window)) throw new Error(x('mixer.mediaRecorderUnavailable'));
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: settings.microphoneId ? { exact: settings.microphoneId } : undefined,
          channelCount: settings.audio.channelCount,
          echoCancellation: settings.audio.echoCancellation,
          noiseSuppression: settings.audio.noiseSuppression,
          autoGainControl: settings.audio.autoGainControl
        }
      });
      const recorder = new MediaRecorder(stream);
      recordingStream.current = stream;
      mediaRecorder.current = recorder;
      recordingChunks.current = [];
      recordingOffset.current = position;
      recorder.ondataavailable = (event) => {
        if (event.data.size) recordingChunks.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(recordingChunks.current, { type: recorder.mimeType || 'audio/webm' });
        void decodeFile(blob, `${x('mixer.take')} ${tracks.length + 1}`, recordingOffset.current).catch(() =>
          setMessage(x('mixer.recordDecodeFailed'))
        );
        stream.getTracks().forEach((track) => track.stop());
        recordingStream.current = null;
      };
      recorder.start(250);
      if (tracks.length && !playing) await startPlayback(position);
      setRecording(true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : x('status.micRequired'));
    }
  };

  const stopRecording = () => {
    mediaRecorder.current?.stop();
    mediaRecorder.current = null;
    setRecording(false);
  };

  const exportMix = async () => {
    if (!tracks.length || !duration) return;
    setExporting(true);
    try {
      const sampleRate = Math.min(96000, Math.max(44100, ...tracks.map((track) => track.buffer.sampleRate)));
      const offline = new OfflineAudioContext(2, Math.ceil(duration * sampleRate), sampleRate);
      const master = offline.createGain();
      master.gain.value = masterGain;
      master.connect(offline.destination);
      const soloMode = tracks.some((track) => track.solo);
      for (const track of tracks) {
        if (track.muted || (soloMode && !track.solo)) continue;
        const source = offline.createBufferSource();
        source.buffer = track.buffer;
        const gain = offline.createGain();
        gain.gain.value = track.gain;
        source.connect(gain);
        if (typeof offline.createStereoPanner === 'function') {
          const panner = offline.createStereoPanner();
          panner.pan.value = track.pan;
          gain.connect(panner);
          panner.connect(master);
        } else gain.connect(master);
        source.start(track.offset);
      }
      const rendered = await offline.startRendering();
      downloadBlob(audioBufferToWav(rendered), 'OpenVox_Mixdown.wav');
      setMessage(x('mixer.exported'));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : x('mixer.exportFailed'));
    } finally {
      setExporting(false);
    }
  };

  const timelineWidth = Math.max(1, duration);

  return (
    <div className="page">
      <Seo title={x('mixer.title')} description={x('mixer.body')} path="/mixer" />
      <div className="page-header">
        <div className="page-title-wrap">
          <div className="eyebrow">{x('mixer.eyebrow')}</div>
          <h1>{x('mixer.title')}</h1>
          <p>{x('mixer.body')}</p>
        </div>
        <div className="action-row">
          <label className="button button-primary file-button">
            <Icon name="plus" />
            {x('mixer.addTracks')}
            <input
              type="file"
              accept="audio/*"
              multiple
              onChange={(event) => event.target.files && void importFiles(event.target.files)}
            />
          </label>
          <button className="button" disabled={!tracks.length || exporting} onClick={() => void exportMix()}>
            <Icon name="download" />
            {exporting ? x('mixer.rendering') : x('mixer.exportWav')}
          </button>
        </div>
      </div>

      <section className="card panel mixer-transport">
        <div className="transport-buttons">
          <button
            className="button button-primary"
            disabled={!tracks.length}
            onClick={() => void (playing ? Promise.resolve(stopPlayback()) : startPlayback(position))}
          >
            <Icon name={playing ? 'stop' : 'play'} />
            {playing ? x('mixer.stop') : x('mixer.play')}
          </button>
          <button
            className={`button ${recording ? 'button-danger' : ''}`}
            onClick={() => void (recording ? Promise.resolve(stopRecording()) : startRecording())}
          >
            <Icon name={recording ? 'stop' : 'record'} />
            {recording ? x('mixer.stopRecording') : x('mixer.recordTake')}
          </button>
        </div>
        <div className="mixer-time">
          <strong>{formatTime(position)}</strong>
          <span>/ {formatTime(duration)}</span>
        </div>
        <div className="mixer-master">
          <label>
            {x('mixer.master')} · {Math.round(masterGain * 100)}%
          </label>
          <input
            aria-label={x('mixer.master')}
            type="range"
            min="0"
            max="1.25"
            step="0.01"
            value={masterGain}
            onChange={(event) => setMasterGain(Number(event.target.value))}
          />
        </div>
      </section>

      <section className="card panel mixer-timeline-card">
        <div className="mixer-ruler">
          <span>0:00</span>
          <span>{formatTime(duration / 2)}</span>
          <span>{formatTime(duration)}</span>
        </div>
        <div
          className="mixer-timeline"
          style={{ '--playhead': `${duration ? (position / duration) * 100 : 0}%` } as React.CSSProperties}
        >
          <span className="mixer-playhead" />
          {tracks.length ? (
            tracks.map((track) => (
              <div className="mixer-track-row" key={track.id}>
                <div className="mixer-track-controls">
                  <strong title={track.name}>{track.name}</strong>
                  <div className="mixer-track-buttons">
                    <button
                      className={track.muted ? 'active' : ''}
                      aria-label={`${x('mixer.mute')} ${track.name}`}
                      onClick={() => updateTrack(track.id, { muted: !track.muted })}
                    >
                      M
                    </button>
                    <button
                      className={track.solo ? 'active' : ''}
                      aria-label={`${x('mixer.solo')} ${track.name}`}
                      onClick={() => updateTrack(track.id, { solo: !track.solo })}
                    >
                      S
                    </button>
                    <button
                      aria-label={`${x('common.delete')} ${track.name}`}
                      onClick={() => setTracks((current) => current.filter((item) => item.id !== track.id))}
                    >
                      <Icon name="trash" />
                    </button>
                  </div>
                </div>
                <div className="mixer-lane">
                  <div
                    className="mixer-clip"
                    style={{
                      left: `${(track.offset / timelineWidth) * 100}%`,
                      width: `${(track.buffer.duration / timelineWidth) * 100}%`
                    }}
                  >
                    <svg viewBox="0 0 180 50" preserveAspectRatio="none" aria-hidden="true">
                      {track.peaks.map((peak, index) => (
                        <rect key={index} x={index} y={25 - peak * 23} width=".72" height={Math.max(1, peak * 46)} />
                      ))}
                    </svg>
                    <span>{formatTime(track.offset)}</span>
                  </div>
                </div>
                <div className="mixer-strip">
                  <label>
                    {x('mixer.gain')}
                    <input
                      aria-label={`${x('mixer.gain')} ${track.name}`}
                      type="range"
                      min="0"
                      max="1.5"
                      step="0.01"
                      value={track.gain}
                      onChange={(event) => updateTrack(track.id, { gain: Number(event.target.value) })}
                    />
                  </label>
                  <label>
                    {x('mixer.pan')}
                    <input
                      aria-label={`${x('mixer.pan')} ${track.name}`}
                      type="range"
                      min="-1"
                      max="1"
                      step="0.01"
                      value={track.pan}
                      onChange={(event) => updateTrack(track.id, { pan: Number(event.target.value) })}
                    />
                  </label>
                  <label>
                    {x('mixer.offset')}
                    <input
                      aria-label={`${x('mixer.offset')} ${track.name}`}
                      type="number"
                      min="0"
                      step="0.05"
                      value={track.offset}
                      onChange={(event) => updateTrack(track.id, { offset: Math.max(0, Number(event.target.value)) })}
                    />
                  </label>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state mixer-empty">
              <Icon name="wave" />
              <h2>{x('mixer.empty')}</h2>
              <p>{x('mixer.emptyBody')}</p>
            </div>
          )}
        </div>
        <input
          aria-label={x('mixer.seek')}
          type="range"
          min="0"
          max={Math.max(duration, 0.01)}
          step="0.01"
          value={Math.min(position, duration || 0)}
          onChange={(event) => void seek(Number(event.target.value))}
          disabled={!duration}
        />
      </section>

      <section className="mixer-bottom-grid">
        <div className="card panel">
          <div className="card-title">
            <h2>{x('mixer.loop')}</h2>
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
            <button className="mini-button" onClick={() => setLoopA(position)}>
              {x('mixer.setA')}
            </button>
            <button className="mini-button" onClick={() => setLoopB(position)}>
              {x('mixer.setB')}
            </button>
            <button className="mini-button" disabled={!loopValid} onClick={() => setLoopEnabled((value) => !value)}>
              {loopEnabled ? x('mixer.disableLoop') : x('mixer.enableLoop')}
            </button>
          </div>
        </div>
        <div className="card panel">
          <div className="card-title">
            <h2>{x('mixer.signal')}</h2>
            <span className="badge">32-bit float</span>
          </div>
          <p className="hint">{x('mixer.signalBody')}</p>
          <div className="metric-row">
            <div>
              <span>{x('mixer.tracks')}</span>
              <strong>{tracks.length}</strong>
            </div>
            <div>
              <span>{x('mixer.solo')}</span>
              <strong>{anySolo ? tracks.filter((track) => track.solo).length : '—'}</strong>
            </div>
          </div>
        </div>
      </section>
      {message && (
        <div className="toast" role="status">
          {message}
        </div>
      )}
    </div>
  );
}
